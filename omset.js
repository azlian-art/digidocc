document.addEventListener("DOMContentLoaded", function () {
    // Define exchange rates for currency conversion
    let exchangeRates = {
        "USD": 1 / 16310, // USD to IDR
        "EUR": 1 / 19000, // EUR to IDR
        "IDR": 1 // Rupiah
    };

    let selectedCurrency = "IDR"; // Main currency is IDR
    const vesselContainer = document.getElementById("vessel-container");
    const addVesselBtn = document.getElementById("add-vessel-btn");
    const currencyDropdown = document.getElementById("currency-selector");

    // Load vessels from localStorage or initialize empty array
    let vessels = JSON.parse(localStorage.getItem("vessels")) || [];

    // Save vessels array to localStorage
    function saveVessels() {
        localStorage.setItem("vessels", JSON.stringify(vessels));
    }

    // Return a color string based on sales type
    function getColorBySalesType(type) {
        const colors = {
            "Navy Vessels (KRI)": "rgba(54, 162, 235, 0.6)",
            "Commercial Vessel": "rgba(255, 99, 132, 0.6)",
            "Non-Vessel": "rgba(75, 192, 192, 0.6)"
        };
        return colors[type] || "rgba(128, 128, 128, 0.6)";
    }

    // Add a vessel card; vesselId is the index in the vessels array.
    function addVesselTable(vesselName = "", salesType = "Navy Vessels (KRI)") {
        // Prompt for vessel name if not provided.
        if (!vesselName) {
            vesselName = prompt("Enter Vessel Name:");
            if (!vesselName) return;
        }

        // Generate a unique vesselId
        const vesselId = vessels.length; // Use the current length as the ID

        // Create a select element for sales type.
        const salesTypeSelect = document.createElement("select");
        const salesTypes = ["Navy Vessels (KRI)", "Commercial Vessel", "Non-Vessel"];
        salesTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            salesTypeSelect.appendChild(option);
        });
        salesTypeSelect.value = salesType;

        // Create a new vessel object with additional project date fields.
        const newVessel = {
            name: vesselName,
            salesType: salesType,
            weeks: [],
            budget: null, // To be set via "Adjust Budget"
            chart: null,
            contractBudget: 0,
            progressPercentage: 0,
            targetSales: 0,
            projectStart: null,
            projectEnd: null
        };
        vessels.push(newVessel);
        saveVessels();
        const currentVesselId = vessels.length - 1;
        const color = getColorBySalesType(salesType);

        // Build the vessel card HTML.
        const vesselDiv = document.createElement("div");
        vesselDiv.classList.add("spreadsheet");
        vesselDiv.setAttribute("id", `vessel-${currentVesselId}`);

        vesselDiv.innerHTML = `
            <h3>${vesselName} - Weekly Data 
                <button class="edit-btn" data-vessel="${currentVesselId}">Edit</button>
                <button class="toggle-btn" data-vessel="${currentVesselId}">-</button>
            </h3>
            <div class="vessel-details">
                <table>
                    <thead>
                        <tr>
                            <th>Week</th>
                            <th>Cost</th>
                            <th>Remaining Income</th>
                        </tr>
                    
                    </thead>
                    <tbody id="vessel-body-${currentVesselId}"></tbody>
                </table>
                <button class="add-week-btn" data-vessel="${currentVesselId}">Add Week</button>
                <label for="sales-type-${currentVesselId}">Sales Type:</label>
                ${salesTypeSelect.outerHTML}
                <button id="adjust-budget-btn-${currentVesselId}" class="adjust-budget-btn">Adjust Budget</button>
                <canvas id="chart-${currentVesselId}" width="768" height="384" style="display: block; box-sizing: border-box;"></canvas>
                <p id="profit-${currentVesselId}" class="profit">Profit: Not Set</p>
                <button class="print-btn" data-vessel="${currentVesselId}">Print Data</button>

                <h3>Contract Budget</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Contract Budget</th>
                            <th>Progress Percentage</th>
                            <th>Sale Amount</th>
                            <th>Target Sales (%)</th>
                        </tr>
                    </thead>
                    <tbody id="contract-budget-body-${currentVesselId}">
                        <tr>
                            <td><span id="contract-budget-display-${currentVesselId}">0</span></td>
                            <td><span id="progress-percentage-${currentVesselId}">0</span>%</td>
                            <td><span class="sale-amount" data-vessel="${currentVesselId}">0</span></td>
                            <td><input type="number" class="target-sales-input" data-vessel="${currentVesselId}" value="0" min="0" max="100" /></td>
                        </tr>
                    </tbody>
                </table>

                <div class="project-dates">
                    <label>Start Date: <input type="date" class="project-start" data-vessel="${currentVesselId}"></label>
                    <label>End Date: <input type="date" class="project-end" data-vessel="${currentVesselId}"></label>
                </div>
            </div>
        `;

        vesselContainer.appendChild(vesselDiv);

        // Attach event listeners:
        document.getElementById(`adjust-budget-btn-${currentVesselId}`).addEventListener("click", () => {
            showBudgetAdjustment(currentVesselId);
        });

        document.querySelector(`.print-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            printVesselData(currentVesselId);
        });

        document.querySelector(`.target-sales-input[data-vessel="${currentVesselId}"]`).addEventListener("input", () => {
            updateContractDetails(currentVesselId);
            updateChart(currentVesselId);
        });

        document.querySelector(`.toggle-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            const details = vesselDiv.querySelector('.vessel-details');
            details.classList.toggle('collapsed');
            document.querySelector(`.toggle-btn[data-vessel="${currentVesselId}"]`).textContent =
                details.classList.contains('collapsed') ? "+" : "-";
        });

        document.querySelector(`.edit-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            const newName = prompt("Enter new Vessel Name:", vesselName);
            if (newName) {
                vessels[currentVesselId].name = newName;
                vesselDiv.querySelector("h3").childNodes[0].nodeValue = `${newName} - Weekly Data`;
                saveVessels();
            }
        });

        document.querySelector(`.add-week-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            let numWeeks = parseInt(prompt("How many weeks would you like to add?"), 10);
            if (!isNaN(numWeeks) && numWeeks > 0) {
                for (let i = 0; i < numWeeks; i++) {
                    addWeek(currentVesselId);
                }
            }
        });

        document.querySelector(`.project-start[data-vessel="${currentVesselId}"]`).addEventListener("change", (e) => {
            vessels[currentVesselId].projectStart = e.target.value;
            saveVessels();
        });

        document.querySelector(`.project-end[data-vessel="${currentVesselId}"]`).addEventListener("change", (e) => {
            vessels[currentVesselId].projectEnd = e.target.value;
            saveVessels();
        });

        initializeChart(currentVesselId, vesselName, color);
        updateChart(currentVesselId);
        saveVessels();
    }

    // Show budget adjustment prompt and update the vessel's budget.
    function showBudgetAdjustment(vesselId) {
        const newBudget = parseFloat(prompt("Enter Initial Budget:"));
        if (isNaN(newBudget)) {
            alert("Please enter a valid budget.");
            return;
        }
        vessels[vesselId].budget = newBudget;
        updateChart(vesselId);
        updateProfitDisplay(vesselId);
        saveVessels();
    }

    // Update profit display (calculates remaining income).
    function updateProfitDisplay(vesselId, remainingBudget) {
        const vesselData = vessels[vesselId];
        let initialBudget = vesselData.budget || 0;
        if (remainingBudget === undefined) {
            let totalCost = calculateTotalCost(vesselId);
            remainingBudget = initialBudget - totalCost;
        }
        document.getElementById(`profit-${vesselId}`).textContent =
            `Profit: ${convertCurrency(remainingBudget).toLocaleString()} ${selectedCurrency}`;
    }

    // Calculate total cost by summing all week-cost values.
    function calculateTotalCost(vesselId) {
        let totalCost = 0;
        document.querySelectorAll(`.week-cost[data-vessel="${vesselId}"]`).forEach(input => {
            totalCost += parseFloat(input.value) || 0;
        });
        return totalCost;
    }

    // Add a week row to a vessel's table.
    function addWeek(vesselId) {
        const vesselBody = document.getElementById(`vessel-body-${vesselId}`);
        if (!vesselBody) return;
        const weekNumber = vesselBody.rows.length + 1;
        const row = vesselBody.insertRow();
        const weekCell = row.insertCell(0);
        const costCell = row.insertCell(1);
        const incomeCell = row.insertCell(2);

        weekCell.textContent = `Week ${weekNumber}`;
        costCell.innerHTML = `<input type="number" class="week-cost" data-vessel="${vesselId}" data-week="${weekNumber}" value="0" />`;
        incomeCell.innerHTML = `<input type="number" class="week-income" data-vessel="${vesselId}" data-week="${weekNumber}" value="0" readonly />`;

        // Update chart when cost is entered.
        costCell.querySelector("input").addEventListener("input", () => {
            updateChart(vesselId);
        });
        updateChart(vesselId);
        saveVessels();
    }

    // Initialize a Chart.js chart for a vessel.
    function initializeChart(vesselId, vesselName, color) {
        const ctx = document.getElementById(`chart-${vesselId}`).getContext("2d");
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Remaining Budget",
                        data: [],
                        borderColor: color,
                        backgroundColor: color,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: "Cost",
                        data: [],
                        borderColor: "rgba(255, 165, 0, 0.6)",
                        backgroundColor: "rgba(255, 165, 0, 0.6)",
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: "Target Sales",
                        data: [],
                        borderColor: "rgba(255, 215, 0, 0.6)",
                        backgroundColor: "rgba(255, 215, 0, 0.6)",
                        fill: false,
                        borderDash: [5, 5],
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()} ${selectedCurrency}`;
                            }
                        }
                    }
                }
            }
        });
        vessels[vesselId].chart = chart;
    }

    // Update the chart and related data based on week costs and target sales.
    function updateChart(vesselId) {
        const vesselData = vessels[vesselId];
        const chart = vesselData.chart;
        if (!chart || vesselData.budget === null) return;
        let labels = [];
        let remainingBudgetData = [];
        let costData = [];
        let remainingBudget = vesselData.budget; // initial budget

        document.querySelectorAll(`.week-cost[data-vessel="${vesselId}"]`).forEach(input => {
            const week = input.getAttribute("data-week");
            const cost = parseFloat(input.value) || 0;
            costData.push(cost);
            labels.push(`Week ${week}`);
        });

        // Compute remaining budget for each week
        for (let i = 0; i < costData.length; i++) {
            remainingBudget -= costData[i];
            const incomeField = document.querySelector(`.week-income[data-vessel="${vesselId}"][data-week="${i + 1}"]`);
            if (incomeField) {
                incomeField.value = remainingBudget;
            }
            remainingBudgetData.push(remainingBudget);
        }

        // Update chart datasets
        chart.data.labels = labels;
        chart.data.datasets[0].data = remainingBudgetData.map(b => convertCurrency(b));
        chart.data.datasets[1].data = costData.map(c => convertCurrency(c));

        // Calculate target sales based on percentage input (using initial budget)
        const targetSalesPercentage = parseFloat(document.querySelector(`.target-sales-input[data-vessel="${vesselId}"]`).value) || 0;
        const targetSalesValue = (vesselData.budget * (targetSalesPercentage / 100)).toFixed(2);
        const targetSalesData = Array(labels.length).fill(convertCurrency(targetSalesValue));
        chart.data.datasets[2].data = targetSalesData;

        chart.update();
        updateProfitDisplay(vesselId, remainingBudget);
        document.getElementById(`contract-budget-display-${vesselId}`).textContent = convertCurrency(remainingBudget).toLocaleString();

        const totalCost = costData.reduce((acc, cost) => acc + cost, 0);
        const progressPercentage = vesselData.budget > 0 ? ((totalCost / vesselData.budget) * 100).toFixed(2) : 0;
        document.getElementById(`progress-percentage-${vesselId}`).textContent = progressPercentage;

        updateContractDetails(vesselId);
    }

    // Convert an amount using the selected currency rate.
    function convertCurrency(amount) {
        return amount * exchangeRates[selectedCurrency];
    }

    // Update contract details based on contract budget and target sales percentage.
    function updateContractDetails(vesselId) {
        const contractBudget = parseFloat(document.getElementById(`contract-budget-display-${vesselId}`).textContent) || 0;
        const progressPercentage = parseFloat(document.getElementById(`progress-percentage-${vesselId}`).textContent) || 0;
        const targetSalesPercentage = parseFloat(document.querySelector(`.target-sales-input[data-vessel="${vesselId}"]`).value) || 0;
        const saleAmount = (contractBudget * (progressPercentage / 100)).toFixed(2);
        document.querySelector(`.sale-amount[data-vessel="${vesselId}"]`).textContent = convertCurrency(saleAmount);
        const targetSalesValue = (contractBudget * (targetSalesPercentage / 100)).toFixed(2);
        vessels[vesselId].targetSales = convertCurrency(targetSalesValue);
    }

    // Open a print window with the vessel's data and chart.
    function printVesselData(vesselId) {
        const vesselDiv = document.getElementById(`vessel-${vesselId}`);
        const chartCanvas = document.getElementById(`chart-${vesselId}`);
        const profitDisplay = document.getElementById(`profit-${vesselId}`).textContent;
        const printWindow = window.open("", "", "height=800,width=600");
        printWindow.document.write("<html><head><title>Vessel Data</title>");
        printWindow.document.write("<style>");
        printWindow.document.write("body { font-family: Arial, sans-serif; }");
        printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }");
        printWindow.document.write("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        printWindow.document.write("th { background-color: #f2f2f2; }");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write("<h3>" + vesselDiv.querySelector("h3").textContent + "</h3>");
        let tableHTML = vesselDiv.querySelector("table").outerHTML;
        tableHTML = tableHTML.replace(/<input[^>]*>/g, function(match) {
            const value = match.value;
            return `<span>${value}</span>`;
        });
        printWindow.document.write(tableHTML);
        let contractTableHTML = vesselDiv.querySelector("h3 + table").outerHTML;
        contractTableHTML = contractTableHTML.replace(/<input[^>]*>/g, function(match) {
            const value = match.value;
            return `<span>${value}</span>`;
        });
        printWindow.document.write(contractTableHTML);
 printWindow.document.write("<p>" + profitDisplay + "</p>");
        printWindow.document.write("<h4>Chart:</h4>");
        printWindow.document.write('<img src="' + chartCanvas.toDataURL() + '" alt="Chart">');
        printWindow.document.write('<button onclick="window.print()">Print</button>');
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
    }

    // Event listener for adding vessels.
    addVesselBtn.addEventListener("click", addVesselTable);

    // Delegate "Add Week" clicks to the vessel container (in case they bubble up).
    vesselContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-week-btn")) {
            const vesselId = event.target.getAttribute("data-vessel");
            addWeek(vesselId);
        }
    });

    // Delegate input events on cost fields.
    vesselContainer.addEventListener("input", function (event) {
        if (event.target.classList.contains("week-cost") || event.target.classList.contains("week-budget")) {
            const vesselId = event.target.getAttribute("data-vessel");
            updateChart(vesselId);
        }
    });

    // Event listener for currency changes.
    currencyDropdown.addEventListener("change", function (e) {
        selectedCurrency = e.target.value;
        vessels.forEach((_, id) => {
            updateChart(id);
            updateProfitDisplay(id);
        });
    });

    // Load existing vessels from localStorage (with correct IDs).
    vessels.forEach((vessel, index) => {
        addVesselTable(vessel.name, vessel.salesType);
    });
}); 
document.addEventListener("DOMContentLoaded", function () {
    // Define exchange rates for currency conversion
    let exchangeRates = {
        "USD": 1 / 15700, // USD to IDR
        "EUR": 0.92 / 15700, // EUR to IDR
        "IDR": 1 // Rupiah
    };

    let selectedCurrency = "IDR"; // Main currency is IDR
    const vesselContainer = document.getElementById("vessel-container");
    const addVesselBtn = document.getElementById("add-vessel-btn");
    const currencyDropdown = document.getElementById("currency-selector");

    // Load vessels from localStorage or initialize empty array
    let vessels = JSON.parse(localStorage.getItem("vessels")) || [];

    // Save vessels array to localStorage
    function saveVessels() {
        localStorage.setItem("vessels", JSON.stringify(vessels));
    }

    // Return a color string based on sales type
    function getColorBySalesType(type) {
        const colors = {
            "Navy Vessels (KRI)": "rgba(54, 162, 235, 0.6)",
            "Commercial Vessel": "rgba(255, 99, 132, 0.6)",
            "Non-Vessel": "rgba(75, 192, 192, 0.6)"
        };
        return colors[type] || "rgba(128, 128, 128, 0.6)";
    }

    // Add a vessel card; vesselId is the index in the vessels array.
    function addVesselTable(vesselName = "", salesType = "Navy Vessels (KRI)") {
        // Prompt for vessel name if not provided.
        if (!vesselName) {
            vesselName = prompt("Enter Vessel Name:");
            if (!vesselName) return;
        }

        // Generate a unique vesselId
        const vesselId = vessels.length; // Use the current length as the ID

        // Create a select element for sales type.
        const salesTypeSelect = document.createElement("select");
        const salesTypes = ["Navy Vessels (KRI)", "Commercial Vessel", "Non-Vessel"];
        salesTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            salesTypeSelect.appendChild(option);
        });
        salesTypeSelect.value = salesType;

        // Create a new vessel object with additional project date fields.
        const newVessel = {
            name: vesselName,
            salesType: salesType,
            weeks: [],
            budget: null, // To be set via "Adjust Budget"
            chart: null,
            contractBudget: 0,
            progressPercentage: 0,
            targetSales: 0,
            projectStart: null,
            projectEnd: null
        };
        vessels.push(newVessel);
        saveVessels();
        const currentVesselId = vessels.length - 1;
        const color = getColorBySalesType(salesType);

        // Build the vessel card HTML.
        const vesselDiv = document.createElement("div");
        vesselDiv.classList.add("spreadsheet");
        vesselDiv.setAttribute("id", `vessel-${currentVesselId}`);

        vesselDiv.innerHTML = `
            <h3>${vesselName} - Weekly Data 
                <button class="edit-btn" data-vessel="${currentVesselId}">Edit</button>
                <button class="toggle-btn" data-vessel="${currentVesselId}">-</button>
            </h3>
            <div class="vessel-details">
                <table>
                    <thead>
                        <tr>
                            <th>Week</th>
                            <th>Cost</th>
                            <th>Remaining Income</th>
                        </tr>
                    </thead>
                    <tbody id="vessel-body-${currentVesselId}"></tbody>
                </table>
                <button class="add-week-btn" data-vessel="${currentVesselId}">Add Week</button>
                <label for="sales-type-${currentVesselId}">Sales Type:</label>
                ${salesTypeSelect.outerHTML}
                <button id="adjust-budget-btn-${currentVesselId}" class="adjust-budget-btn">Adjust Budget</button>
                <canvas id="chart-${currentVesselId}" width="768" height="384" style="display: block; box-sizing: border-box;"></canvas>
                <p id="profit-${currentVesselId}" class="profit">Profit: Not Set</p>
                <button class="print-btn" data-vessel="${currentVesselId}">Print Data</button>

                <h3>Contract Budget</h3>
                <table>
                    <thead>
 
                        <tr>
                            <th>Contract Budget</th>
                            <th>Progress Percentage</th>
                            <th>Sale Amount</th>
                            <th>Target Sales (%)</th>
                        </tr>
                    </thead>
                    <tbody id="contract-budget-body-${currentVesselId}">
                        <tr>
                            <td><span id="contract-budget-display-${currentVesselId}">0</span></td>
                            <td><span id="progress-percentage-${currentVesselId}">0</span>%</td>
                            <td><span class="sale-amount" data-vessel="${currentVesselId}">0</span></td>
                            <td><input type="number" class="target-sales-input" data-vessel="${currentVesselId}" value="0" min="0" max="100" /></td>
                        </tr>
                    </tbody>
                </table>

                <div class="project-dates">
                    <label>Start Date: <input type="date" class="project-start" data-vessel="${currentVesselId}"></label>
                    <label>End Date: <input type="date" class="project-end" data-vessel="${currentVesselId}"></label>
                </div>
            </div>
        `;

        vesselContainer.appendChild(vesselDiv);

        // Attach event listeners:
        document.getElementById(`adjust-budget-btn-${currentVesselId}`).addEventListener("click", () => {
            showBudgetAdjustment(currentVesselId);
        });

        document.querySelector(`.print-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            printVesselData(currentVesselId);
        });

        document.querySelector(`.target-sales-input[data-vessel="${currentVesselId}"]`).addEventListener("input", () => {
            updateContractDetails(currentVesselId);
            updateChart(currentVesselId);
        });

        document.querySelector(`.toggle-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            const details = vesselDiv.querySelector('.vessel-details');
            details.classList.toggle('collapsed');
            document.querySelector(`.toggle-btn[data-vessel="${currentVesselId}"]`).textContent =
                details.classList.contains('collapsed') ? "+" : "-";
        });

        document.querySelector(`.edit-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            const newName = prompt("Enter new Vessel Name:", vesselName);
            if (newName) {
                vessels[currentVesselId].name = newName;
                vesselDiv.querySelector("h3").childNodes[0].nodeValue = `${newName} - Weekly Data`;
                saveVessels();
            }
        });

        document.querySelector(`.add-week-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            let numWeeks = parseInt(prompt("How many weeks would you like to add?"), 10);
            if (!isNaN(numWeeks) && numWeeks > 0) {
                for (let i = 0; i < numWeeks; i++) {
                    addWeek(currentVesselId);
                }
            }
        });

        document.querySelector(`.project-start[data-vessel="${currentVesselId}"]`).addEventListener("change", (e) => {
            vessels[currentVesselId].projectStart = e.target.value;
            saveVessels();
        });

        document.querySelector(`.project-end[data-vessel="${currentVesselId}"]`).addEventListener("change", (e) => {
            vessels[currentVesselId].projectEnd = e.target.value;
            saveVessels();
        });

        initializeChart(currentVesselId, vesselName, color);
        updateChart(currentVesselId);
        saveVessels();
    }

    // Show budget adjustment prompt and update the vessel's budget.
    function showBudgetAdjustment(vesselId) {
        const newBudget = parseFloat(prompt("Enter Initial Budget:"));
        if (isNaN(newBudget)) {
            alert("Please enter a valid budget.");
            return;
        }
        vessels[vesselId].budget = newBudget;
        updateChart(vesselId);
        updateProfitDisplay(vesselId);
        saveVessels();
    }

    // Update profit display (calculates remaining income).
    function updateProfitDisplay(vesselId, remainingBudget) {
        const vesselData = vessels[vesselId];
        let initialBudget = vesselData.budget || 0;
        if (remainingBudget === undefined) {
            let totalCost = calculateTotalCost(vesselId);
            remainingBudget = initialBudget - totalCost;
        }
        document.getElementById(`profit-${vesselId}`).textContent =
            `Profit: ${convertCurrency(remainingBudget).toLocaleString()} ${selectedCurrency}`;
    }

    // Calculate total cost by summing all week-cost values.
    function calculateTotalCost(vesselId) {
        let totalCost = 0;
        document.querySelectorAll(`.week-cost[data-vessel="${vesselId}"]`).forEach(input => {
            totalCost += parseFloat(input.value) || 0;
        });
        return totalCost;
    }

    // Add a week row to a vessel's table.
    function addWeek(vesselId) {
        const vesselBody = document.getElementById(`vessel-body-${vesselId}`);
        if (!vesselBody) return;
        const weekNumber = vesselBody.rows.length + 1;
        const row = vesselBody.insertRow();
        const weekCell = row.insertCell(0);
        const costCell = row.insertCell(1);
        const incomeCell = row.insertCell(2);

        weekCell.textContent = `Week ${weekNumber}`;
        costCell.innerHTML = `<input type="number" class="week-cost" data-vessel="${vesselId}" data-week="${weekNumber}" value="0" />`;
        incomeCell.innerHTML = `<input type="number" class="week-income" data-vessel="${vesselId}" data-week="${weekNumber}" value="0" readonly />`;

        // Update chart when cost is entered.
        costCell.querySelector("input").addEventListener("input", () => {
            updateChart(vesselId);
        });
        updateChart(vesselId);
        saveVessels();
    }

    // Initialize a Chart.js chart for a vessel.
    function initializeChart(vesselId, vesselName, color) {
        const ctx = document.getElementById(`chart-${vesselId}`).getContext("2d");
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Remaining Budget",
                        data: [],
                        borderColor: color,
                        backgroundColor: color,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: "Cost",
                        data: [],
                        borderColor: "rgba(255, 165, 0, 0.6)",
                        backgroundColor: "rgba(255, 165, 0, 0.6)",
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: "Target Sales",
                        data: [],
                        borderColor: "rgba(255, 215, 0, 0.6)",
                        backgroundColor: "rgba(255, 215, 0, 0.6)",
                        fill: false,
                        borderDash: [5, 5],
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()} ${selectedCurrency}`;
                            }
                        }
                    }
                }
            }
        });
        vessels[vesselId].chart = chart;
    }

    // Update the chart and related data based on week costs and target sales.
    function updateChart(vesselId) {
        const vesselData = vessels[vesselId];
        const chart = vesselData.chart;
        if (!chart || vesselData.budget === null) return;
        let labels = [];
        let remainingBudgetData = [];
        let costData = [];
        let remainingBudget = vesselData.budget; // initial budget

        document.querySelectorAll(`.week-cost[data-vessel="${vesselId}"]`).forEach(input => {
            const week = input.getAttribute("data-week");
            const cost = parseFloat(input.value) || 0;
            costData.push(cost);
            labels.push(`Week ${week}`);
        });

        // Compute remaining budget for each week
        for (let i = 0; i < costData.length; i++) {
            remainingBudget -= costData[i];
            const incomeField = document.querySelector(`.week-income[data-vessel="${vesselId}"][data-week="${i + 1}"]`);
            if (incomeField) {
                incomeField.value = remainingBudget;
            }
            remainingBudgetData.push(remainingBudget);
        }

        // Update chart datasets
        chart.data.labels = labels;
        chart.data.datasets[0].data = remainingBudgetData.map(b => convertCurrency(b));
        chart.data.datasets[1].data = costData.map(c => convertCurrency(c));

        // Calculate target sales based on percentage input (using initial budget)
        const targetSalesPercentage = parseFloat(document.querySelector(`.target-sales-input[data 
        vessel="${vesselId}"]`).value) || 0;
        const targetSalesValue = (vesselData.budget * (targetSalesPercentage / 100)).toFixed(2);
        const targetSalesData = Array(labels.length).fill(convertCurrency(targetSalesValue));
        chart.data.datasets[2].data = targetSalesData;

        chart.update();
        updateProfitDisplay(vesselId, remainingBudget);
        document.getElementById(`contract-budget-display-${vesselId}`).textContent = convertCurrency(remainingBudget).toLocaleString();

        const totalCost = costData.reduce((acc, cost) => acc + cost, 0);
        const progressPercentage = vesselData.budget > 0 ? ((totalCost / vesselData.budget) * 100).toFixed(2) : 0;
        document.getElementById(`progress-percentage-${vesselId}`).textContent = progressPercentage;

        updateContractDetails(vesselId);
    }

    // Convert an amount using the selected currency rate.
    function convertCurrency(amount) {
        return amount * exchangeRates[selectedCurrency];
    }

    // Update contract details based on contract budget and target sales percentage.
    function updateContractDetails(vesselId) {
        const contractBudget = parseFloat(document.getElementById(`contract-budget-display-${vesselId}`).textContent) || 0;
        const progressPercentage = parseFloat(document.getElementById(`progress-percentage-${vesselId}`).textContent) || 0;
        const targetSalesPercentage = parseFloat(document.querySelector(`.target-sales-input[data-vessel="${vesselId}"]`).value) || 0;
        const saleAmount = (contractBudget * (progressPercentage / 100)).toFixed(2);
        document.querySelector(`.sale-amount[data-vessel="${vesselId}"]`).textContent = convertCurrency(saleAmount);
        const targetSalesValue = (contractBudget * (targetSalesPercentage / 100)).toFixed(2);
        vessels[vesselId].targetSales = convertCurrency(targetSalesValue);
    }

    // Open a print window with the vessel's data and chart.
    function printVesselData(vesselId) {
        const vesselDiv = document.getElementById(`vessel-${vesselId}`);
        const chartCanvas = document.getElementById(`chart-${vesselId}`);
        const profitDisplay = document.getElementById(`profit-${vesselId}`).textContent;
        const printWindow = window.open("", "", "height=800,width=600");
        printWindow.document.write("<html><head><title>Vessel Data</title>");
        printWindow.document.write("<style>");
        printWindow.document.write("body { font-family: Arial, sans-serif; }");
        printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }");
        printWindow.document.write("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        printWindow.document.write("th { background-color: #f2f2f2; }");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write("<h3>" + vesselDiv.querySelector("h3").textContent + "</h3>");
        let tableHTML = vesselDiv.querySelector("table").outerHTML;
        tableHTML = tableHTML.replace(/<input[^>]*>/g, function(match) {
            const value = match.value;
            return `<span>${value}</span>`;
        });
        printWindow.document.write(tableHTML);
        let contractTableHTML = vesselDiv.querySelector("h3 + table").outerHTML;
        contractTableHTML = contractTableHTML.replace(/<input[^>]*>/g, function(match) {
            const value = match.value;
            return `<span>${value}</span>`;
        });
        printWindow.document.write(contractTableHTML);
        printWindow.document.write("<p>" + profitDisplay + "</p>");
        printWindow.document.write("<h4>Chart:</h4>");
        printWindow.document.write('<img src="' + chartCanvas.toDataURL() + '" alt="Chart">');
        printWindow.document.write('<button onclick="window.print()">Print</button>');
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
    }

    // Event listener for adding vessels.
    addVesselBtn.addEventListener("click", addVesselTable);

    // Delegate "Add Week" clicks to the vessel container (in case they bubble up).
    vesselContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-week-btn")) {
            const vesselId = event.target.getAttribute("data-vessel");
            addWeek(vesselId);
        }
    });

    // Delegate input events on cost fields.
    vesselContainer.addEventListener("input", function (event) {
        if (event.target.classList.contains("week-cost") || event.target.classList.contains("week-budget")) {
            const vesselId = event.target.getAttribute("data-vessel");
            updateChart(vesselId);
        }
    });

    // Event listener for currency changes.
    currencyDropdown.addEventListener("change", function (e) {
        selectedCurrency = e.target.value;
        vessels.forEach((_, id) => {
            updateChart(id);
            updateProfitDisplay(id);
        });
    });

    // Load existing vessels from localStorage (with correct IDs).
    vessels.forEach((vessel, index) => {
        addVesselTable(vessel.name, vessel.salesType);
    });
}); //The provided JavaScript code is already structured to handle multiple charts dynamically for each vessel without the need for a second JavaScript file. Each time a vessel is added, a new chart is created and associated with that vessel's data. 

//### Key Features of the Current Implementation:
//1. **Dynamic Chart Creation**: Each vessel has its own chart initialized when the vessel is added.
//2. **Data Management**: The code manages the data for each vessel separately, ensuring that each chart reflects the correct data.
//3. **Single File Structure**: All functionality is contained within a single JavaScript file, making it easier to maintain and update.

//### No Need for a Second File
//Since the current implementation already supports multiple charts, you do not need a second JavaScript file. You can simply continue to add vessels, and the existing code will handle the creation and management of charts for each vessel.

//### Example of Adding a Vessel
//When you click the "Add Vessel" button, the following happens:
//- A prompt asks for the vessel name.
//- A new vessel object is created and added to the `vessels` array.
//- A new chart is initialized for that vessel.
//- The vessel's data is saved to local storage.

//### Conclusion
//You can continue using the existing JavaScript file to manage multiple charts for different vessels. If you have specific requirements or additional features you want to implement, feel free to ask!```javascript
document.addEventListener("DOMContentLoaded", function () {
    // Define exchange rates for currency conversion
    let exchangeRates = {
        "USD": 1 / 15700, // USD to IDR
        "EUR": 0.92 / 15700, // EUR to IDR
        "IDR": 1 // Rupiah
    };

    let selectedCurrency = "IDR"; // Main currency is IDR
    const vesselContainer = document.getElementById("vessel-container");
    const addVesselBtn = document.getElementById("add-vessel-btn");
    const currencyDropdown = document.getElementById("currency-selector");

    // Load vessels from localStorage or initialize empty array
    let vessels = JSON.parse(localStorage.getItem("vessels")) || [];

    // Save vessels array to localStorage
    function saveVessels() {
        localStorage.setItem("vessels", JSON.stringify(vessels));
    }

    // Return a color string based on sales type
    function getColorBySalesType(type) {
        const colors = {
            "Navy Vessels (KRI)": "rgba(54, 162, 235, 0.6)",
            "Commercial Vessel": "rgba(255, 99, 132, 0.6)",
            "Non-Vessel": "rgba(75, 192, 192, 0.6)"
        };
        return colors[type] || "rgba(128, 128, 128, 0.6)";
    }

    // Add a vessel card; vesselId is the index in the vessels array.
    function addVesselTable(vesselName = "", salesType = "Navy Vessels (KRI)") {
        // Prompt for vessel name if not provided.
        if (!vesselName) {
            vesselName = prompt("Enter Vessel Name:");
            if (!vesselName) return;
        }

        // Generate a unique vesselId
        const vesselId = vessels.length; // Use the current length as the ID

        // Create a select element for sales type.
        const salesTypeSelect = document.createElement("select");
        const salesTypes = ["Navy Vessels (KRI)", "Commercial Vessel", "Non-Vessel"];
        salesTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            salesTypeSelect.appendChild(option);
        });
        salesTypeSelect.value = salesType;

        // Create a new vessel object with additional project date fields.
        const newVessel = {
            name: vesselName,
            salesType: salesType,
            weeks: [],
            budget: null, // To be set via "Adjust Budget"
            chart: null,
            contractBudget: 0,
            progressPercentage: 0,
            targetSales: 0,
            projectStart: null,
            projectEnd: null
        };
        vessels.push(newVessel);
        saveVessels();
        const currentVesselId = vessels.length - 1;
        const color = getColorBySalesType(salesType);

        // Build the vessel card HTML.
        const vesselDiv = document.createElement("div");
        vesselDiv.classList.add("spreadsheet");
        vesselDiv.setAttribute("id", `vessel-${currentVesselId}`);

        vesselDiv.innerHTML = `
            <h3>${vesselName} - Weekly Data 
                <button class="edit-btn" data-vessel="${currentVesselId}">Edit</button>
                <button class="toggle-btn" data-vessel="${currentVesselId}">-</button>
            </h3>
            <div class="vessel-details">
                <table>
                    <thead>
                        <tr>
                            <th>Week</th>
                            <th>Cost</th>
                            <th>Remaining Income</th>
                        </tr>
                    </thead>
                    <tbody id="vessel-body-${currentVesselId}"></tbody>
                </table>
                <button class="add-week-btn" data-vessel="${currentVesselId}">Add Week</button>
                <label for="sales-type-${currentVesselId}">Sales Type:</label>
                ${salesTypeSelect.outerHTML}
                <button id="adjust-budget-btn-${currentVesselId}" class="adjust-budget-btn">Adjust Budget</button>
                <canvas id="chart-${currentVesselId}" width="768" height="384" style="display: block; box-sizing: border-box;"></canvas>
                <p id="profit-${currentVesselId}" class="profit">Profit: Not Set</p>
                <button class="print-btn" data-vessel="${currentVesselId}">Print Data</button>

                <h3>Contract Budget</h3>
                <table>
                    <thead>
 
                        <tr>
                            <th>Contract Budget</th>
                            <th>Progress Percentage</th>
                            <th>Sale Amount</th>
                            <th>Target Sales (%)</th>
                        </tr>
                    </thead>
                    <tbody id="contract-budget-body-${currentVesselId}">
                        <tr>
                            <td><span id="contract-budget-display-${currentVesselId}">0</span></td>
                            <td><span id="progress-percentage-${currentVesselId}">0</span>%</td>
                            <td><span class="sale-amount" data-vessel="${currentVesselId}">0</span></td>
                            <td><input type="number" class="target-sales-input" data-vessel="${currentVesselId}" value="0" min="0" max="100" /></td>
                        </tr>
                    </tbody>
                </table>

                <div class="project-dates">
                    <label>Start Date: <input type="date" class="project-start" data-vessel="${currentVesselId}"></label>
                    <label>End Date: <input type="date" class="project-end" data-vessel="${currentVesselId}"></label>
                </div>
            </div>
        `;

        vesselContainer.appendChild(vesselDiv);

        // Attach event listeners:
        document.getElementById(`adjust-budget-btn-${currentVesselId}`).addEventListener("click", () => {
            showBudgetAdjustment(currentVesselId);
        });

        document.querySelector(`.print-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            printVesselData(currentVesselId);
        });

        document.querySelector(`.target-sales-input[data-vessel="${currentVesselId}"]`).addEventListener("input", () => {
            updateContractDetails(currentVesselId);
            updateChart(currentVesselId);
        });

        document.querySelector(`.toggle-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            const details = vesselDiv.querySelector('.vessel-details');
            details.classList.toggle('collapsed');
            document.querySelector(`.toggle-btn[data-vessel="${currentVesselId}"]`).textContent =
                details.classList.contains('collapsed') ? "+" : "-";
        });

        document.querySelector(`.edit-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            const newName = prompt("Enter new Vessel Name:", vesselName);
            if (newName) {
                vessels[currentVesselId].name = newName;
                vesselDiv.querySelector("h3").childNodes[0].nodeValue = `${newName} - Weekly Data`;
                saveVessels();
            }
        });

        document.querySelector(`.add-week-btn[data-vessel="${currentVesselId}"]`).addEventListener("click", () => {
            let numWeeks = parseInt(prompt("How many weeks would you like to add?"), 10);
            if (!isNaN(numWeeks) && numWeeks > 0) {
                for (let i = 0; i < numWeeks; i++) {
                    addWeek(currentVesselId);
                }
            }
        });

        document.querySelector(`.project-start[data-vessel="${currentVesselId}"]`).addEventListener("change", (e) => {
            vessels[currentVesselId].projectStart = e.target.value;
            saveVessels();
        });

        document.querySelector(`.project-end[data-vessel="${currentVesselId}"]`).addEventListener("change", (e) => {
            vessels[currentVesselId].projectEnd = e.target.value;
            saveVessels();
        });

        initializeChart(currentVesselId, vesselName, color);
        updateChart(currentVesselId);
        saveVessels();
    }

    // Show budget adjustment prompt and update the vessel's budget.
    function showBudgetAdjustment(vesselId) {
        const newBudget = parseFloat(prompt("Enter Initial Budget:"));
        if (isNaN(newBudget)) {
            alert("Please enter a valid budget.");
            return;
        }
        vessels[vesselId].budget = newBudget;
        updateChart(vesselId);
        updateProfitDisplay(vesselId);
        saveVessels();
    }

    // Update profit display (calculates remaining income).
    function updateProfitDisplay(vesselId, remainingBudget) {
        const vesselData = vessels[vesselId];
        let initialBudget = vesselData.budget || 0;
        if (remainingBudget === undefined) {
            let totalCost = calculateTotalCost(vesselId);
            remainingBudget = initialBudget - totalCost;
        }
        document.getElementById(`profit-${vesselId}`).textContent =
            `Profit: ${convertCurrency(remainingBudget).toLocaleString()} ${selectedCurrency}`;
    }

    // Calculate total cost by summing all week-cost values.
    function calculateTotalCost(vesselId) {
        let totalCost = 0;
        document.querySelectorAll(`.week-cost[data-vessel="${vesselId}"]`).forEach(input => {
            totalCost += parseFloat(input.value) || 0;
        });
        return totalCost;
    }

    // Add a week row to a vessel's table.
    function addWeek(vesselId) {
        const vesselBody = document.getElementById(`vessel-body-${vesselId}`);
        if (!vesselBody) return;
        const weekNumber = vesselBody.rows.length + 1;
        const row = vesselBody.insertRow();
        const weekCell = row.insertCell(0);
        const costCell = row.insertCell(1);
        const incomeCell = row.insertCell(2);

        weekCell.textContent = `Week ${weekNumber}`;
        costCell.innerHTML = `<input type="number" class="week-cost" data-vessel="${vesselId}" data-week="${weekNumber}" value="0" />`;
        incomeCell.innerHTML = `<input type="number" class="week-income" data-vessel="${vesselId}" data-week="${weekNumber}" value="0" readonly />`;

        // Update chart when cost is entered.
        costCell.querySelector("input").addEventListener("input", () => {
            updateChart(vesselId);
        });
        updateChart(vesselId);
        saveVessels();
    }

    // Initialize a Chart.js chart for a vessel.
    function initializeChart(vesselId, vesselName, color) {
        const ctx = document.getElementById(`chart-${vesselId}`).getContext("2d");
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Remaining Budget",
                        data: [],
                        borderColor: color,
                        backgroundColor: color,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: "Cost",
                        data: [],
                        borderColor: "rgba(255, 165, 0, 0.6)",
                        backgroundColor: "rgba(255, 165, 0, 0.6)",
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: "Target Sales",
                        data: [],
                        borderColor: "rgba(255, 215, 0, 0.6)",
                        backgroundColor: "rgba(255, 215, 0, 0.6)",
                        fill: false,
                        borderDash: [5, 5],
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()} ${selectedCurrency}`;
                            }
                        }
                    }
                }
            }
        });
        vessels[vesselId].chart = chart;
    }

    // Update the chart and related data based on week costs and target sales.
    function updateChart(vesselId) {
        const vesselData = vessels[vesselId];
        const chart = vesselData.chart;
        if (!chart || vesselData.budget === null) return;
        let labels = [];
        let remainingBudgetData = [];
        let costData = [];
        let remainingBudget = vesselData.budget; // initial budget

        document.querySelectorAll(`.week-cost[data-vessel="${vesselId}"]`).forEach(input => {
            const week = input.getAttribute("data-week");
            const cost = parseFloat(input.value) || 0;
            costData.push(cost);
            labels.push(`Week ${week}`);
        });

        // Compute remaining budget for each week
        for (let i = 0; i < costData.length; i++) {
            remainingBudget -= costData[i];
            const incomeField = document.querySelector(`.week-income[data-vessel="${vesselId}"][data-week="${i + 1}"]`);
            if (incomeField) {
                incomeField.value = remainingBudget;
            }
            remainingBudgetData.push(remainingBudget);
        }

        // Update chart datasets
        chart.data.labels = labels;
        chart.data.datasets[0].data = remainingBudgetData.map(b => convertCurrency(b));
        chart.data.datasets[1].data = costData.map(c => convertCurrency(c));

        // Calculate target sales based on percentage input (using initial budget)
        const targetSalesPercentage = parseFloat(document.querySelector(`.target-sales-input[data 
        vessel="${vesselId}"]`).value) || 0;
        const targetSalesValue = (vesselData.budget * (targetSalesPercentage / 100)).toFixed(2);
        const targetSalesData = Array(labels.length).fill(convertCurrency(targetSalesValue));
        chart.data.datasets[2].data = targetSalesData;

        chart.update();
        updateProfitDisplay(vesselId, remainingBudget);
        document.getElementById(`contract-budget-display-${vesselId}`).textContent = convertCurrency(remainingBudget).toLocaleString();

        const totalCost = costData.reduce((acc, cost) => acc + cost, 0);
        const progressPercentage = vesselData.budget > 0 ? ((totalCost / vesselData.budget) * 100).toFixed(2) : 0;
        document.getElementById(`progress-percentage-${vesselId}`).textContent = progressPercentage;

        updateContractDetails(vesselId);
    }

    // Convert an amount using the selected currency rate.
    function convertCurrency(amount) {
        return amount * exchangeRates[selectedCurrency];
    }

    // Update contract details based on contract budget and target sales percentage.
    function updateContractDetails(vesselId) {
        const contractBudget = parseFloat(document.getElementById(`contract-budget-display-${vesselId}`).textContent) || 0;
        const progressPercentage = parseFloat(document.getElementById(`progress-percentage-${vesselId}`).textContent) || 0;
        const targetSalesPercentage = parseFloat(document.querySelector(`.target-sales-input[data-vessel="${vesselId}"]`).value) || 0;
        const saleAmount = (contractBudget * (progressPercentage / 100)).toFixed(2);
        document.querySelector(`.sale-amount[data-vessel="${vesselId}"]`).textContent = convertCurrency(saleAmount);
        const targetSalesValue = (contractBudget * (targetSalesPercentage / 100)).toFixed(2);
        vessels[vesselId].targetSales = convertCurrency(targetSalesValue);
    }

    // Open a print window with the vessel's data and chart.
    function printVesselData(vesselId) {
        const vesselDiv = document.getElementById(`vessel-${vesselId}`);
        const chartCanvas = document.getElementById(`chart-${vesselId}`);
        const profitDisplay = document.getElementById(`profit-${vesselId}`).textContent;
        const printWindow = window.open("", "", "height=800,width=600");
        printWindow.document.write("<html><head><title>Vessel Data</title>");
        printWindow.document.write("<style>");
        printWindow.document.write("body { font-family: Arial, sans-serif; }");
        printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }");
        printWindow.document.write("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        printWindow.document.write("th { background-color: #f2f2f2; }");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write("<h3>" + vesselDiv.querySelector("h3").textContent + "</h3>");
        let tableHTML = vesselDiv.querySelector("table").outerHTML;
        tableHTML = tableHTML.replace(/<input[^>]*>/g, function(match) {
            const value = match.value;
            return `<span>${value}</span>`;
        });
        printWindow.document.write(tableHTML);
        let contractTableHTML = vesselDiv.querySelector("h3 + table").outerHTML;
        contractTableHTML = contractTableHTML.replace(/<input[^>]*>/g, function(match) {
            const value = match.value;
            return `<span>${value}</span>`;
        });
        printWindow.document.write(contractTableHTML);
        printWindow.document.write("<p>" + profitDisplay + "</p>");
        printWindow.document.write("<h4>Chart:</h4>");
        printWindow.document.write('<img src="' + chartCanvas.toDataURL() + '" alt="Chart">');
        printWindow.document.write('<button onclick="window.print()">Print</button>');
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
    }

    // Event listener for adding vessels.
    addVesselBtn.addEventListener("click", addVesselTable);

    // Delegate "Add Week" clicks to the vessel container (in case they bubble up).
    vesselContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-week-btn")) {
            const vesselId = event.target.getAttribute("data-vessel");
            addWeek(vesselId);
        }
    });

    // Delegate input events on cost fields.
    vesselContainer.addEventListener("input", function (event) {
        if (event.target.classList.contains("week-cost") || event.target.classList.contains("week-budget")) {
            const vesselId = event.target.getAttribute("data-vessel");
            updateChart(vesselId);
        }
    });

    // Event listener for currency changes.
    currencyDropdown.addEventListener("change", function (e) {
        selectedCurrency = e.target.value;
        vessels.forEach((_, id) => {
            updateChart(id);
            updateProfitDisplay(id);
        });
    });

    // Load existing vessels from localStorage (with correct IDs).
    vessels.forEach((vessel, index) => {
        addVesselTable(vessel.name, vessel.salesType);
    });
});