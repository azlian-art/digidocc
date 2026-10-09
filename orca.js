const dockLength = 300; // meters
const dockWidth = 32; // meters
const DOCK_ID = 2;
const LOCAL_SHIPS_KEY = 'ships_smg';
const API_BASE = './api';
let totalLengthUsed = 0; // Track total length used by ships
let currentMonth = new Date(); // Track the currently displayed month

async function apiRequest(endpoint, options = {}, fallbackValue = null) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options
        });
        const text = await response.text();
        const payload = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(payload.message || 'Request failed');
        return payload;
    } catch (error) {
        if (fallbackValue !== null) return { ...fallbackValue, message: error.message };
        return { success: false, message: error.message };
    }
}

function getShipsFromStorage() {
    return JSON.parse(localStorage.getItem(LOCAL_SHIPS_KEY)) || [];
}

function saveShipsToStorage(ships) {
    localStorage.setItem(LOCAL_SHIPS_KEY, JSON.stringify(ships));
    return ships;
}

function parseRangeInput(id) {
    const value = document.getElementById(id).value.trim();
    const match = value.match(/^(\d+(?:[.,]\d+)?)\s*(?:[-–—]\s*(\d+(?:[.,]\d+)?))?$/);
    if (!match) return { min: NaN, max: NaN };

    const min = Number(match[1].replace(',', '.'));
    const max = match[2] ? Number(match[2].replace(',', '.')) : min;
    return { min, max };
}

function parseLoaRange() {
    return parseRangeInput('loa');
}

function parseDraftRange() {
    return parseRangeInput('t');
}

function getRangeText(ship, minKey, maxKey, textKey, valueKey = minKey) {
    if (ship[textKey]) return ship[textKey];
    const min = ship[minKey] ?? ship[valueKey];
    const max = ship[maxKey] ?? ship[valueKey];
    return max != null && Number(max) !== Number(min) ? `${min}–${max}` : min;
}

function formatRange(ship, minKey, maxKey, textKey, valueKey = minKey) {
    return String(getRangeText(ship, minKey, maxKey, textKey, valueKey)).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function formatDraft(ship) {
    if (ship.draftText) {
        return ship.draftText.replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }
    return ship.draftMax != null && Number(ship.draftMax) !== Number(ship.draft)
        ? `${ship.draft}–${ship.draftMax}`
        : ship.draft;
}

function formatLoa(ship) {
    if (ship.loaText) {
        return ship.loaText.replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }
    return ship.loaMax != null && Number(ship.loaMax) !== Number(ship.loa)
        ? `${ship.loa}–${ship.loaMax}`
        : ship.loa;
}

document.querySelectorAll('input[type="date"]').forEach(input => {
    input.addEventListener('click', function () {
        if (typeof this.showPicker === 'function') {
            this.showPicker();
        }
    });
});

async function syncShipsFromServer() {
    const response = await apiRequest('/ships.php', { method: 'GET' }, { success: true, data: [] });
    if (!response || !response.success || !Array.isArray(response.data)) return getShipsFromStorage();

    const dockShips = response.data
        .filter(ship => Number(ship.dock_id) === DOCK_ID)
        .map(ship => ({
            shipName: ship.ship_name,
            loa: ship.loa_max == null ? Number(ship.loa) : Number(ship.loa_max),
            loaMax: ship.loa_max == null ? Number(ship.loa) : Number(ship.loa_max),
            loaText: ship.loa_text || '',
            beam: ship.beam_max == null ? Number(ship.beam) : Number(ship.beam_max),
            beamMin: Number(ship.beam),
            beamMax: ship.beam_max == null ? Number(ship.beam) : Number(ship.beam_max),
            beamText: ship.beam_text || '',
            draft: Number(ship.draft),
            draftMax: ship.draft_max == null ? Number(ship.draft) : Number(ship.draft_max),
            draftText: ship.draft_text || '',
            gt: ship.gt_max == null ? Number(ship.gt) : Number(ship.gt_max),
            gtMin: Number(ship.gt),
            gtMax: ship.gt_max == null ? Number(ship.gt) : Number(ship.gt_max),
            gtText: ship.gt_text || '',
            dwt: ship.dwt_max == null ? Number(ship.dwt) : Number(ship.dwt_max),
            dwtMin: Number(ship.dwt),
            dwtMax: ship.dwt_max == null ? Number(ship.dwt) : Number(ship.dwt_max),
            dwtText: ship.dwt_text || '',
            date: ship.schedule_date || ship.stay_start,
            stayStart: ship.stay_start,
            stayEnd: ship.stay_end
        }));

    if (dockShips.length > 0) {
        saveShipsToStorage(dockShips);
        return dockShips;
    }
    return getShipsFromStorage();
}

window.addEventListener('DOMContentLoaded', async function () {
    await syncShipsFromServer();
});

document.getElementById('dockingSpaceChecker').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    const dockDropdown = document.getElementById('dockDropdown');
    dockDropdown.style.display = dockDropdown.style.display === 'none' ? 'block' : 'none'; // Toggle visibility
});

// Add event listeners to the dropdown items
document.querySelectorAll('#dockDropdown a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        const selectedDock = this.getAttribute('href'); // Get the href of the clicked link
        window.location.href = selectedDock; // Navigate to the selected dock page
    });
});

document.getElementById('dockingForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const shipName = document.getElementById('shipName').value;
    const loaRange = parseLoaRange();
    const loaText = document.getElementById('loa').value.trim();
    const loaMin = loaRange.min;
    const loa = loaRange.max;
    const beamRange = parseRangeInput('b');
    const beamText = document.getElementById('b').value.trim();
    const b = beamRange.max;
    const draftRange = parseDraftRange();
    const draftText = document.getElementById('t').value.trim();
    const t = Number.isFinite(draftRange.min) ? draftRange.min : 0;
    const draftMax = Number.isFinite(draftRange.max) ? draftRange.max : t;
    const gtRange = parseRangeInput('gt');
    const gtText = document.getElementById('gt').value.trim();
    const gt = gtRange.max;
    const dwtRange = parseRangeInput('dwt');
    const dwtText = document.getElementById('dwt').value.trim();
    const dwt = dwtRange.max;
    const date = document.getElementById('date').value;
    const stayStartValue = document.getElementById('stayStart').value;
    const stayEndValue = document.getElementById('stayEnd').value;
    const stayStart = new Date(`${stayStartValue}T00:00:00`);
    const stayEnd = new Date(`${stayEndValue}T00:00:00`);
    const editingIndex = document.getElementById('editingShipIndex').value;

    const invalidFields = [
        ['Ship LOA', Number.isFinite(loaMin) && loaMin > 0 && Number.isFinite(loa) && loa >= loaMin ? loa : NaN],
        ['Ship Beam', Number.isFinite(beamRange.min) && beamRange.min > 0 && Number.isFinite(b) && b >= beamRange.min ? b : NaN],
        ['Ship GT', Number.isFinite(gtRange.min) && gtRange.min > 0 && Number.isFinite(gt) && gt >= gtRange.min ? gt : NaN],
        ['Ship DWT', Number.isFinite(dwtRange.min) && dwtRange.min > 0 && Number.isFinite(dwt) && dwt >= dwtRange.min ? dwt : NaN]
    ].filter(([, value]) => !Number.isFinite(value)).map(([label]) => label);

    if (!draftText) invalidFields.push('Ship Draft');

    if (invalidFields.length > 0) {
        document.getElementById('result').textContent =
            `Periksa kolom berikut: ${invalidFields.join(', ')}.`;
        return;
    }

    if (canDock(loa, b, stayStart, stayEnd)) {
        const ships = getShipsFromStorage();
        const shipDetails = {
            shipName: shipName,
            loa: loa,
            loaMax: loa,
            loaText: loaText,
            beam: b,
            beamMin: beamRange.min,
            beamMax: b,
            beamText: beamText,
            draft: t,
            draftMax: draftMax,
            draftText: draftText,
            gt: gt,
            gtMin: gtRange.min,
            gtMax: gt,
            gtText: gtText,
            dwt: dwt,
            dwtMin: dwtRange.min,
            dwtMax: dwt,
            dwtText: dwtText,
            date: date,
            stayStart: stayStart.toISOString(),
            stayEnd: stayEnd.toISOString()
        };

        if (editingIndex !== "") {
            ships[editingIndex] = shipDetails;
            document.getElementById('editingShipIndex').value = "";
        } else {
            ships.push(shipDetails);
        }

        const saveResponse = await apiRequest('/ships.php', {
            method: 'POST',
            body: JSON.stringify({
                dock_id: DOCK_ID,
                ship_name: shipName,
                loa: loa,
                loa_min: loaMin,
                loa_max: loa,
                loa_text: loaText,
                beam: b,
                beam_min: beamRange.min,
                beam_max: b,
                beam_text: beamText,
                draft: t,
                draft_max: draftMax,
                draft_text: draftText,
                gt: gt,
                gt_min: gtRange.min,
                gt_max: gt,
                gt_text: gtText,
                dwt: dwt,
                dwt_min: dwtRange.min,
                dwt_max: dwt,
                dwt_text: dwtText,
                stay_start: `${stayStartValue} 00:00:00`,
                stay_end: `${stayEndValue} 00:00:00`,
                schedule_date: date
            })
        }, { success: false, message: 'Database request failed' });

        saveShipsToStorage(ships);
        displayResult(ships);
        displayShipList(ships);
        drawGanttChart(ships);
        drawRemainingSpaceChart(ships);
        populateCalendarSchedule();

        if (saveResponse && saveResponse.success === false) {
            const result = document.getElementById('result');
            result.innerHTML = '<h3>Saved Locally Only</h3><p></p>';
            result.querySelector('p').textContent =
                `Database save failed: ${saveResponse.message}. Data is only in this browser.`;
        }
    } else {
        document.getElementById('result').innerHTML = `
            <h3>Docking Space Not Available</h3>
            <p>Ship cannot dock due to size constraints or overlapping schedule.</p>
            <p>Required Length: ${loa} m, Required Width: ${b} m</p>
            <p>Available Length: ${dockLength} m, Available Width: ${dockWidth} m</p>
        `;
    }
});

// Function to check if the ship can dock
function canDock(loa, b, stayStart, stayEnd) {
    const ships = getShipsFromStorage();
    let totalLengthUsedOnDay = 0;

    // Calculate total length used on the specific day
    ships.forEach(ship => {
        const existingStayStart = new Date(ship.stayStart);
        const existingStayEnd = new Date(ship.stayEnd);

        // Check if the ship is docked on the same day as the new ship
        if ((stayStart <= existingStayEnd) && (stayEnd >= existingStayStart)) {
            totalLengthUsedOnDay += ship.loa; // Add the length of the ship
        }
    });

    // Check if the new ship can fit in the dock length on the day
    return (totalLengthUsedOnDay + loa <= dockLength) && (b <= dockWidth);
}

// Function to calculate total length used for a specific date
function calculateTotalLengthUsedForDate(date) {
    const ships = getShipsFromStorage();
    let totalLength = 0;

    ships.forEach(ship => {
        const stayStart = new Date(ship.stayStart);
        const stayEnd = new Date(ship.stayEnd);

        // Check if the ship is docked on the given date
        if (date >= stayStart && date <= stayEnd) {
            totalLength += ship.loa; // Add the length of the ship
        }
    });

    return totalLength;
}

// Function to display the result
function displayResult(ships) {
    const currentDate = new Date();
    const remainingLength = dockLength; // Calculate remaining length for today
    const remainingWidth = dockWidth; // Width remains constant

    document.getElementById('result').innerHTML = `
        <h3>Docking Space Available</h3>
        <p>Length: ${remainingLength.toFixed(2)} meters</p>
        <p>Width: ${remainingWidth.toFixed(2)} meters</p>
    `;
}

// Function to display the list of ships
function displayShipList(ships) {
    const shipTableBody = document.getElementById('shipTableBody');
    shipTableBody.innerHTML = ''; // Clear existing rows

    if (ships.length === 0) {
        shipTableBody.innerHTML = '<tr><td colspan="10">No ships docked yet.</td></tr>';
        return;
    }

    const currentDate = new Date();

    ships.forEach((ship, index) => {
        const stayStartDate = new Date(ship.stayStart);
        const stayEndDate = new Date(ship.stayEnd);
        const daysOfStay = Math.ceil((stayEndDate - stayStartDate) / (1000 * 60 * 60 * 24)); // Calculate days

        // Determine if the ship is leaving soon (within the next 3 days)
        const daysUntilDeparture = Math.ceil((stayEndDate - currentDate) / (1000 * 60 * 60 * 24));
        const isLeavingSoon = daysUntilDeparture >= 0 && daysUntilDeparture <= 3;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ship.shipName}</td>
            <td>${formatLoa(ship)}</td>
            <td>${formatRange(ship, 'beamMin', 'beamMax', 'beamText', 'beam')}</td>
            <td>${formatDraft(ship)}</td>
            <td>${formatRange(ship, 'gtMin', 'gtMax', 'gtText', 'gt')}</td>
            <td>${formatRange(ship, 'dwtMin', 'dwtMax', 'dwtText', 'dwt')}</td>
            <td>${formatDate(stayStartDate)} to ${formatDate(stayEndDate)}</td>
            <td>${daysOfStay} days</td>
            <td>${formatDate(new Date(ship.date))}</td>
            <td>
                <button class="edit-button" onclick="editShip(${index})">Edit</button>
                <button class="delete-button" onclick="deleteShip(${index})">Del</button>
            </td>
        `;

        // Apply a class for visual indication if the ship is leaving soon
        if (isLeavingSoon) {
            row.classList.add('leavingF-soon');
        }

        shipTableBody.appendChild(row);
    });
}

// Function to edit a ship
function editShip(index) {
    const ships = JSON.parse(localStorage.getItem('ships_smg')) || [];
    const ship = ships[index];

    // Populate the form fields with the ship's details
    document.getElementById('shipName').value = ship.shipName;
    document.getElementById('loa').value = ship.loaText || (
        ship.loaMax != null && Number(ship.loaMax) !== Number(ship.loa)
            ? `${ship.loa}–${ship.loaMax}`
            : ship.loa
    );
    document.getElementById('b').value = getRangeText(ship, 'beamMin', 'beamMax', 'beamText', 'beam');
    document.getElementById('t').value = ship.draftText || (
        ship.draftMax != null && Number(ship.draftMax) !== Number(ship.draft)
            ? `${ship.draft}–${ship.draftMax}`
            : ship.draft
    );
    document.getElementById('gt').value = getRangeText(ship, 'gtMin', 'gtMax', 'gtText', 'gt');
    document.getElementById('dwt').value = getRangeText(ship, 'dwtMin', 'dwtMax', 'dwtText', 'dwt');
    document.getElementById('date').value = ship.date;
    document.getElementById('stayStart').value = formatDate(new Date(ship.stayStart));
    document.getElementById('stayEnd').value = formatDate(new Date(ship.stayEnd));

    // Store the index of the ship being edited
    document.getElementById('editingShipIndex').value = index; // Add a hidden input to track the index
}

// Function to format a date in the year-month-date format
function formatDate(date) {
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${year}-${padZero(month)}-${padZero(day)}`;
}

// Function to pad a number with a leading zero if necessary
function padZero(number) {
    return (number < 10 ? '0' : '') + number;
}

// Function to draw the Gantt chart for ships
function drawGanttChart(ships) {
    const canvas = document.getElementById('ganttChart');
    const ctx = canvas.getContext('2d');
    const chartHeight = 30; // Height of each bar
    const barSpacing = 20; // Space between bars
    const startX = 50; // Starting X position for the bars
    const startY = 50; // Starting Y position for the bars

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set the date range for the x-axis
    const dates = ships.map(ship => {
        return {
            start: new Date(ship.stayStart),
            end: new Date(ship.stayEnd),
            name: ship.shipName
        };
    });

    // Find the minimum and maximum dates
    const minDate = new Date(Math.min(...dates.map(d => d.start)));
    const maxDate = new Date(Math.max(...dates.map(d => d.end)));

    // Calculate the total width of the chart
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    const dayWidth = (canvas.width - startX) / totalDays;

    // Draw the bars for each ship
    dates.forEach((ship, index) => {
        const barX = startX + Math.ceil((ship.start - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;
        const barY = startY + index * (chartHeight + barSpacing);
        const barWidth = (ship.end - ship.start) / (1000 * 60 * 60 * 24) * dayWidth;

        // Draw the bar
        ctx.fillStyle = 'skyblue';
        ctx.fillRect(barX, barY, barWidth, chartHeight);

        // Draw the ship name
        ctx.fillStyle = 'black';
        ctx.fillText(ship.name, barX + 5, barY + chartHeight / 1.5);

        // Draw start and end date labels
        ctx.fillText(formatDate(ship.start), barX, barY - 5); // Start date above the bar
        ctx.fillText(formatDate(ship.end), barX + barWidth - 50, barY - 5); // End date above the bar
    });
}

// Function to draw the Gantt chart for remaining space
function drawRemainingSpaceChart(ships) {
    const canvas = document.getElementById('remainingSpaceChart');
    const ctx = canvas.getContext('2d');
    const chartHeight = 30; // Height of each bar
    const barSpacing = 10; // Space between bars
    const startX = 50; // Starting X position for the bars
    const startY = 50; // Starting Y position for the bars

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set the date range for the x-axis
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 30); // Show next 30 days
    const totalDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
    const dayWidth = (canvas.width - startX) / totalDays;

    // Draw the remaining space for each day
    for (let i = 0; i < totalDays; i++) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);
        const usedLength = calculateTotalLengthUsedForDate(date);
        const remainingLength = dockLength - usedLength;

        const barX = startX + i * dayWidth;
        const barY = startY;
        const barWidth = dayWidth - 2; // Slightly reduce width for spacing

        // Draw the remaining space bar
        ctx.fillStyle = 'lightgreen';
        ctx.fillRect(barX, barY, barWidth, chartHeight);

        // Draw remaining length text
        ctx.fillStyle = 'black';
        ctx.fillText(`${remainingLength.toFixed(2)} m`, barX + 5, barY + chartHeight / 1.5);

        // Draw date label
        ctx.fillText(formatDate(date), barX, barY - 5);
    }
}

// Function to populate the calendar-like schedule for the upcoming month
function populateCalendarSchedule() {
    const calendarTableBody = document.getElementById('calendarTableBody');
    calendarTableBody.innerHTML = ''; // Clear existing rows

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // Last day of the month

    const totalDays = lastDay.getDate();
    let weekRow = document.createElement('tr');
    let weekDayCount = 0;

    // Fill the first week with empty cells if necessary
    for (let i = 0; i < firstDay.getDay(); i++) {
        weekRow.appendChild(document.createElement('td')); // Empty cell
        weekDayCount++;
    }

    // Loop through each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);

        // Create a cell for the current date
        const cell = document.createElement('td');
        cell.innerHTML = `<strong>${day}</strong>`; // Only show the date initially

        // Add ship names for the current date
        const ships = JSON.parse(localStorage.getItem('ships_smg')) || [];
        const shipsOnDate = ships.filter(ship => {
            const stayStart = new Date(ship.stayStart);
            const stayEnd = new Date(ship.stayEnd);
            return date >= stayStart && date <= stayEnd;
        });

        if (shipsOnDate.length > 0) {
            // If there are ships, show only the ship names
            cell.innerHTML += `<br><strong>Ships:</strong><br>`;
            shipsOnDate.forEach(ship => {
                cell.innerHTML += `${ship.shipName}<br>`;
            });
        }

        // Apply color gradation based on whether there are ships
        if (shipsOnDate.length === 0) {
            cell.style.backgroundColor = 'white'; // No ships - Empty
        } else {
            cell.style.backgroundColor = 'lightblue'; // Ships present - Blue
        }

        // Add the cell to the current week row
        weekRow.appendChild(cell);
        weekDayCount++;

        // Check if the week is complete (7 days)
        if (weekDayCount === 7) {
            calendarTableBody.appendChild(weekRow); // Add the week row to the table
            weekRow = document.createElement('tr'); // Start a new week row
            weekDayCount = 0; // Reset the day count
        }
    }

    // If there are remaining days in the last week, add them to the table
    if (weekDayCount > 0) {
        for (let i = weekDayCount; i < 7; i++) {
            weekRow.appendChild(document.createElement('td')); // Empty cell
        }
        calendarTableBody.appendChild(weekRow);
    }

    // Update the month and year label
    document.getElementById('monthYearLabel').textContent = `${getMonthName(month)} ${year}`; // Update the title with the current month and year
}

// Function to get the month name
function getMonthName(monthIndex) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthIndex];
}

// Event listeners for month navigation buttons
document.getElementById('nextMonthButton').addEventListener('click', function() {
    currentMonth.setMonth(currentMonth.getMonth() + 1); // Move to the next month
    populateCalendarSchedule(); // Refresh the calendar schedule
});

document.getElementById('prevMonthButton').addEventListener('click', function() {
    currentMonth.setMonth(currentMonth.getMonth() - 1); // Move to the previous month
    populateCalendarSchedule(); // Refresh the calendar schedule
});

document.getElementById('nextYearButton').addEventListener('click', function() {
    currentMonth.setFullYear(currentMonth.getFullYear() + 1); // Move to the next year
    populateCalendarSchedule(); // Refresh the calendar schedule
});

document.getElementById('prevYearButton').addEventListener('click', function() {
    currentMonth.setFullYear(currentMonth.getFullYear() - 1); // Move to the previous year
    populateCalendarSchedule(); // Refresh the calendar schedule
});

// Function to delete a ship from the list
function deleteShip(index) {
    let ships = JSON.parse(localStorage.getItem('ships_smg')) || [];
    ships.splice(index, 1); // Remove the ship at the specified index
    localStorage.setItem('ships_smg', JSON.stringify(ships)); // Update local storage
    displayShipList(ships); // Refresh the ship list
    drawRemainingSpaceChart(ships); // Redraw the remaining space chart
    populateCalendarSchedule(); // Refresh the calendar schedule
}

// Event listener for the delete all button
document.getElementById('deleteAllButton').addEventListener('click', function() {
    localStorage.removeItem('ships_smg'); // Clear all ships from local storage
    totalLengthUsed = 0; // Reset total length used
    displayShipList([]); // Clear the ship list display
    drawRemainingSpaceChart([]); // Clear the remaining space chart
    populateCalendarSchedule(); // Clear the calendar schedule
});

// Call populateCalendarSchedule on page load
window.onload = function() {
    const ships = JSON.parse(localStorage.getItem('ships_smg')) || [];
    ships.forEach(ship => {
        totalLengthUsed += ship.loa; // Update total length used
    });
    displayShipList(ships); // Display the list of ships
    displayResult(ships); // Display the initial result
    drawGanttChart(ships); // Draw the initial Gantt chart
    drawRemainingSpaceChart(ships); // Draw the initial remaining space chart
    populateCalendarSchedule(); // Populate the calendar schedule
};