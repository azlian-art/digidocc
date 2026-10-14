document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("vessel-container");
    const addButton = document.getElementById("add-vessel-btn");
    const newVesselName = document.getElementById("new-vessel-name");
    const currencySelector = document.getElementById("currency-selector");
    const conversionRates = { IDR: 1, USD: 1 / 16310, EUR: 1 / 19000 };
    const records = new Map();
    const renderers = new Map();
    const localCacheKey = "vessels";

    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.style.color = "#b42318";
    container.before(status);

    async function request(method, payload) {
        const response = await fetch("./api/mro-sales.php", {
            method,
            headers: { "Content-Type": "application/json" },
            ...(payload ? { body: JSON.stringify(payload) } : {})
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            const error = new Error(result.message || "Database request failed");
            error.status = response.status;
            throw error;
        }
        return result;
    }

    function readLocalCache() {
        try {
            const value = JSON.parse(localStorage.getItem(localCacheKey) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            status.textContent = `Could not read saved browser data: ${error.message}`;
            return [];
        }
    }

    function writeLocalCache() {
        const savedRecords = Array.from(records.values()).map(record => ({
            dbId: record.dbId || null,
            name: record.vessel_name,
            salesType: record.sales_type,
            budget: Number(record.budget) || 0,
            currency: record.currency || "IDR",
            targetSales: Number(record.target_sales_percent) || 0,
            projectStart: record.project_start || null,
            projectEnd: record.project_end || null,
            weeks: Array.isArray(record.weeks) ? [...record.weeks] : [],
            syncPending: Boolean(record.syncPending)
        }));
        try {
            localStorage.setItem(localCacheKey, JSON.stringify(savedRecords));
        } catch (error) {
            status.textContent = `Database data is saved, but browser cache failed: ${error.message}`;
        }
    }

    function toPayload(record) {
        return {
            ...(record.dbId ? { id: record.dbId } : {}),
            vessel_name: record.vessel_name,
            sales_type: record.sales_type,
            budget: record.budget,
            currency: record.currency || "IDR",
            target_sales_percent: record.target_sales_percent,
            project_start: record.project_start,
            project_end: record.project_end,
            weeks: record.weeks
        };
    }

    function formatted(amount) {
        return (Number(amount) * conversionRates[currencySelector.value])
            .toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    function createCard(record) {
        records.set(record.id, record);
        const card = document.createElement("section");
        card.className = "spreadsheet";
        card.dataset.recordId = String(record.id);
        card.innerHTML = `
            <h3>
                <span class="vessel-title"></span>
                <span>
                    <button type="button" class="edit-btn">Edit Name</button>
                    <button type="button" class="toggle-btn">−</button>
                    <button type="button" class="delete-vessel-btn">Delete</button>
                </span>
            </h3>
            <div class="vessel-details">
                <table>
                    <thead><tr><th>Week</th><th>Cost (IDR)</th><th>Remaining Budget (IDR)</th></tr></thead>
                    <tbody></tbody>
                </table>
                <button type="button" class="add-week-btn">Add Week</button>
                <label>Sales Type:
                    <select class="sales-type">
                        <option>Navy Vessels (KRI)</option>
                        <option>Commercial Vessel</option>
                        <option>Non-Vessel</option>
                    </select>
                </label>
                <button type="button" class="adjust-budget-btn">Adjust Budget</button>
                <canvas class="sales-chart" height="120"></canvas>
                <p class="profit"></p>
                <button type="button" class="print-btn">Print Data</button>
                <h3>Contract Budget</h3>
                <table><thead><tr><th>Remaining Contract Budget</th><th>Progress</th><th>Sale Amount</th><th>Target Sales (%)</th></tr></thead>
                    <tbody><tr>
                        <td class="remaining-budget"></td><td class="progress-percent"></td>
                        <td class="sale-amount"></td>
                        <td><input type="number" class="target-sales-input" min="0" max="100" step="0.01"></td>
                    </tr></tbody>
                </table>
                <div class="project-dates">
                    <label>Start Date: <input type="date" class="project-start"></label>
                    <label>End Date: <input type="date" class="project-end"></label>
                </div>
                <p class="save-status" aria-live="polite"></p>
            </div>
        `;

        const title = card.querySelector(".vessel-title");
        title.textContent = `${record.vessel_name} - Weekly Data`;
        const salesType = card.querySelector(".sales-type");
        salesType.value = record.sales_type;
        card.querySelector(".target-sales-input").value = record.target_sales_percent;
        card.querySelector(".project-start").value = record.project_start || "";
        card.querySelector(".project-end").value = record.project_end || "";
        container.appendChild(card);

        const render = () => {
            const tbody = card.querySelector("tbody");
            tbody.replaceChildren();
            let remaining = Number(record.budget) || 0;
            let totalCost = 0;
            record.weeks.forEach((cost, index) => {
                const row = tbody.insertRow();
                row.insertCell().textContent = `Week ${index + 1}`;
                const costCell = row.insertCell();
                const input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.step = "0.01";
                input.value = cost;
                input.setAttribute("aria-label", `Week ${index + 1} cost in IDR`);
                input.addEventListener("change", () => {
                    const value = Number(input.value);
                    if (!Number.isFinite(value) || value < 0) {
                        card.querySelector(".save-status").textContent = "Cost must be a non-negative number.";
                        return;
                    }
                    record.weeks[index] = value;
                    render();
                    scheduleSave(record, card);
                });
                costCell.appendChild(input);
                totalCost += Number(cost) || 0;
                remaining -= Number(cost) || 0;
                row.insertCell().textContent = formatted(remaining);
            });

            const progress = record.budget > 0 ? (totalCost / record.budget) * 100 : 0;
            const target = Number(record.target_sales_percent) || 0;
            card.querySelector(".remaining-budget").textContent = formatted(remaining);
            card.querySelector(".progress-percent").textContent = `${progress.toFixed(2)}%`;
            card.querySelector(".sale-amount").textContent =
                formatted(remaining * (progress / 100));
            card.querySelector(".profit").textContent =
                `Remaining budget: ${formatted(remaining)} ${currencySelector.value}`;

            if (window.Chart) {
                if (card.chart) {
                    card.chart.destroy();
                }
                card.chart = new Chart(card.querySelector(".sales-chart"), {
                    type: "line",
                    data: {
                        labels: record.weeks.map((_, index) => `Week ${index + 1}`),
                        datasets: [
                            { label: "Remaining Budget", data: record.weeks.map((_, index) =>
                                (record.budget - record.weeks.slice(0, index + 1).reduce((sum, value) => sum + Number(value), 0))
                                    * conversionRates[currencySelector.value]) },
                            { label: "Weekly Cost", data: record.weeks.map(value =>
                                Number(value) * conversionRates[currencySelector.value]) },
                            { label: "Target Sales", data: record.weeks.map(() =>
                                record.budget * target / 100 * conversionRates[currencySelector.value]) }
                        ]
                    },
                    options: { responsive: true }
                });
            }
        };
        renderers.set(record.id, render);

        salesType.addEventListener("change", () => {
            record.sales_type = salesType.value;
            title.textContent = `${record.vessel_name} - Weekly Data`;
            scheduleSave(record, card);
        });
        card.querySelector(".target-sales-input").addEventListener("input", event => {
            record.target_sales_percent = Number(event.target.value);
            scheduleSave(record, card);
        });
        card.querySelector(".target-sales-input").addEventListener("change", render);
        card.querySelector(".project-start").addEventListener("change", event => {
            record.project_start = event.target.value || null;
            scheduleSave(record, card);
        });
        card.querySelector(".project-end").addEventListener("change", event => {
            record.project_end = event.target.value || null;
            scheduleSave(record, card);
        });
        card.querySelector(".add-week-btn").addEventListener("click", () => {
            record.weeks.push(0);
            render();
            scheduleSave(record, card);
        });
        card.querySelector(".adjust-budget-btn").addEventListener("click", () => {
            const value = prompt("Enter Initial Budget (IDR):", String(record.budget));
            if (value === null) return;
            const budget = Number(value);
            if (!Number.isFinite(budget) || budget < 0) {
                card.querySelector(".save-status").textContent = "Budget must be a non-negative number.";
                return;
            }
            record.budget = budget;
            render();
            scheduleSave(record, card);
        });
        card.querySelector(".edit-btn").addEventListener("click", () => {
            const value = prompt("Enter new Vessel Name:", record.vessel_name);
            if (value === null || !value.trim()) return;
            record.vessel_name = value.trim();
            title.textContent = `${record.vessel_name} - Weekly Data`;
            scheduleSave(record, card);
        });
        card.querySelector(".toggle-btn").addEventListener("click", event => {
            const details = card.querySelector(".vessel-details");
            details.classList.toggle("collapsed");
            event.currentTarget.textContent = details.classList.contains("collapsed") ? "+" : "−";
        });
        card.querySelector(".print-btn").addEventListener("click", () => window.print());
        card.querySelector(".delete-vessel-btn").addEventListener("click", async () => {
            if (!confirm(`Delete MRO sales record for "${record.vessel_name}"?`)) return;
            try {
                if (record.dbId) {
                    await request("DELETE", { id: record.dbId });
                }
                if (card.chart) card.chart.destroy();
                records.delete(record.id);
                card.remove();
                renderers.delete(record.id);
                writeLocalCache();
                status.textContent = "";
            } catch (error) {
                card.querySelector(".save-status").textContent = `Delete failed: ${error.message}`;
            }
        });
        render();
    }

    const saveTimers = new Map();
    const saving = new Set();
    const dirty = new Set();

    function scheduleSave(record, card) {
        dirty.add(record.id);
        card.querySelector(".save-status").textContent = "Unsaved changes";
        clearTimeout(saveTimers.get(record.id));
        saveTimers.set(record.id, setTimeout(() => saveRecord(record, card), 350));
    }

    async function saveRecord(record, card) {
        if (saving.has(record.id)) return;
        saving.add(record.id);
        try {
            while (dirty.has(record.id)) {
                dirty.delete(record.id);
                card.querySelector(".save-status").textContent = "Saving...";
                const result = await request(record.dbId ? "PUT" : "POST", toPayload(record));
                if (!record.dbId) {
                    record.dbId = result.id;
                }
                record.syncPending = false;
                writeLocalCache();
                card.querySelector(".save-status").textContent = "Saved to database";
            }
        } catch (error) {
            record.syncPending = true;
            writeLocalCache();
            card.querySelector(".save-status").textContent = `Save failed: ${error.message}`;
        } finally {
            saving.delete(record.id);
        }
    }

    addButton.addEventListener("click", async () => {
        const vesselName = newVesselName.value.trim();
        if (!vesselName) {
            status.textContent = "Enter a vessel name before adding the record.";
            newVesselName.focus();
            return;
        }
        try {
            const localId = -Date.now();
            const record = {
                id: localId,
                dbId: null,
                vessel_name: vesselName.trim(),
                sales_type: "Navy Vessels (KRI)",
                budget: 0,
                currency: "IDR",
                target_sales_percent: 0,
                project_start: null,
                project_end: null,
                weeks: [],
                syncPending: true
            };
            createCard(record);
            writeLocalCache();
            dirty.add(record.id);
            saveRecord(record, container.querySelector(`[data-record-id="${record.id}"]`));
            newVesselName.value = "";
            status.textContent = "";
        } catch (error) {
            status.textContent = `Could not add vessel: ${error.message}`;
        }
    });

    currencySelector.addEventListener("change", () => {
        container.querySelectorAll(".spreadsheet").forEach(card => {
            const record = records.get(Number(card.dataset.recordId));
            if (record) renderers.get(record.id)?.();
        });
    });

    try {
        const result = await request("GET");
        const serverRecords = new Map(result.data.map(record => [record.id, record]));
        const cachedRecords = readLocalCache();

        for (const cached of cachedRecords) {
            const record = {
                id: Number(cached.dbId) || -Date.now() - Math.floor(Math.random() * 100000),
                dbId: Number(cached.dbId) || null,
                vessel_name: cached.vessel_name || cached.name || "",
                sales_type: cached.sales_type || cached.salesType || "Navy Vessels (KRI)",
                budget: Number(cached.budget) || 0,
                currency: cached.currency || "IDR",
                target_sales_percent: Number(cached.target_sales_percent ?? cached.targetSales) || 0,
                project_start: cached.project_start || cached.projectStart || null,
                project_end: cached.project_end || cached.projectEnd || null,
                weeks: Array.isArray(cached.weeks)
                    ? cached.weeks.map(week => Number(typeof week === "object" ? week.cost : week) || 0)
                    : [],
                syncPending: Boolean(cached.syncPending)
            };

            const serverRecord = record.dbId ? serverRecords.get(record.dbId) : null;
            if (!record.dbId || !serverRecord || record.syncPending) {
                try {
                    const saved = await request(record.dbId && serverRecord ? "PUT" : "POST", toPayload(record));
                    record.dbId = saved.id;
                    record.id = saved.id;
                    record.syncPending = false;
                    serverRecords.set(saved.id, record);
                } catch (error) {
                    record.syncPending = true;
                    status.textContent = `Some browser data is waiting to sync: ${error.message}`;
                    records.set(record.id, record);
                    createCard(record);
                }
            }
        }

        for (const serverRecord of serverRecords.values()) {
            if (records.has(serverRecord.id)) continue;
            createCard({
                ...serverRecord,
                dbId: serverRecord.id,
                syncPending: false
            });
        }
        writeLocalCache();
        if (!status.textContent) {
            status.textContent = records.size
                ? ""
                : "No MRO sales records yet. Use “Add New Vessel” to create one.";
        }
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            window.location.replace(error.status === 401 ? "login.html" : "menu.html");
            return;
        }

        const cachedRecords = readLocalCache();
        for (const cached of cachedRecords) {
            const record = {
                id: Number(cached.dbId) || -Date.now() - Math.floor(Math.random() * 100000),
                dbId: Number(cached.dbId) || null,
                vessel_name: cached.vessel_name || cached.name || "",
                sales_type: cached.sales_type || cached.salesType || "Navy Vessels (KRI)",
                budget: Number(cached.budget) || 0,
                currency: cached.currency || "IDR",
                target_sales_percent: Number(cached.target_sales_percent ?? cached.targetSales) || 0,
                project_start: cached.project_start || cached.projectStart || null,
                project_end: cached.project_end || cached.projectEnd || null,
                weeks: Array.isArray(cached.weeks)
                    ? cached.weeks.map(week => Number(typeof week === "object" ? week.cost : week) || 0)
                    : [],
                syncPending: true
            };
            createCard(record);
        }
        status.textContent = `Database unavailable; showing browser cache. Changes will sync when available. (${error.message})`;
    }
});
