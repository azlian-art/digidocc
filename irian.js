const dockLength = 225; // meters
const dockWidth = 25; // meters
let totalLengthUsed = 0; // Track total length used by ships
let currentMonth = new Date(); // Track the currently displayed month

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

document.getElementById('dockingForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const shipName = document.getElementById('shipName').value;
    const loa = parseFloat(document.getElementById('loa').value);
    const b = parseFloat(document.getElementById('b').value);
    const t = parseFloat(document.getElementById('t').value);
    const gt = parseFloat(document.getElementById('gt').value);
    const dwt = parseFloat(document.getElementById('dwt').value);
    const date = document.getElementById('date').value;
    const stayStart = new Date(document.getElementById('stayStart').value);
    const stayEnd = new Date(document.getElementById('stayEnd').value);
    const editingIndex = document.getElementById('editingShipIndex').value; // Get the editing index

    // Check if the ship fits in the docking space
    if (canDock(loa, b, stayStart, stayEnd)) {
        const ships = JSON.parse(localStorage.getItem('ships')) || [];

        if (editingIndex !== "") {
            // Update existing ship
            ships[editingIndex] = {
                shipName: shipName,
                loa: loa,
                beam: b,
                draft: t,
                gt: gt,
                dwt: dwt,
                date: date,
                stayStart: stayStart.toISOString(),
                stayEnd: stayEnd.toISOString()
            };
            document.getElementById('editingShipIndex').value = ""; // Clear the editing index
        } else {
            // Add new ship
            ships.push({
                shipName: shipName,
                loa: loa,
                beam: b,
                draft: t,
                gt: gt,
                dwt: dwt,
                date: date,
                stayStart: stayStart.toISOString(),
                stayEnd: stayEnd.toISOString()
            });
        }

        localStorage.setItem('ships', JSON.stringify(ships)); // Save to local storage

        // Display the result and ship list
        displayResult(ships);
        displayShipList(ships);
        drawGanttChart(ships); // Draw the Gantt chart
        drawRemainingSpaceChart(ships); // Draw the remaining space chart
        populateCalendarSchedule(); // Populate the calendar schedule
    } else {
        // Display a message if the ship does not fit
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
    const ships = JSON.parse(localStorage.getItem('ships')) || [];
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
    const ships = JSON.parse(localStorage.getItem('ships')) || [];
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
            <td>${ship.loa}</td>
            <td>${ship.beam}</td>
            <td>${ship.draft}</td>
            <td>${ship.gt}</td>
            <td>${ship.dwt}</td>
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
    const ships = JSON.parse(localStorage.getItem('ships')) || [];
    const ship = ships[index];

    // Populate the form fields with the ship's details
    document.getElementById('shipName').value = ship.shipName;
    document.getElementById('loa').value = ship.loa;
    document.getElementById('b').value = ship.beam;
    document.getElementById('t').value = ship.draft;
    document.getElementById('gt').value = ship.gt;
    document.getElementById('dwt').value = ship.dwt;
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
        const ships = JSON.parse(localStorage.getItem('ships')) || [];
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
    let ships = JSON.parse(localStorage.getItem('ships')) || [];
    ships.splice(index, 1); // Remove the ship at the specified index
    localStorage.setItem('ships', JSON.stringify(ships)); // Update local storage
    displayShipList(ships); // Refresh the ship list
    drawRemainingSpaceChart(ships); // Redraw the remaining space chart
    populateCalendarSchedule(); // Refresh the calendar schedule
}

// Event listener for the delete all button
document.getElementById('deleteAllButton').addEventListener('click', function() {
    localStorage.removeItem('ships'); // Clear all ships from local storage
    totalLengthUsed = 0; // Reset total length used
    displayShipList([]); // Clear the ship list display
    drawRemainingSpaceChart([]); // Clear the remaining space chart
    populateCalendarSchedule(); // Clear the calendar schedule
});

// Call populateCalendarSchedule on page load
window.onload = function() {
    const ships = JSON.parse(localStorage.getItem('ships')) || [];
    ships.forEach(ship => {
        totalLengthUsed += ship.loa; // Update total length used
    });
    displayShipList(ships); // Display the list of ships
    displayResult(ships); // Display the initial result
    drawGanttChart(ships); // Draw the initial Gantt chart
    drawRemainingSpaceChart(ships); // Draw the initial remaining space chart
    populateCalendarSchedule(); // Populate the calendar schedule
};

