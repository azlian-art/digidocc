// Function to render the timeline from localStorage for a specific dock
function renderTimeline(timelineContainerId, localStorageKey) {
    const ships = JSON.parse(localStorage.getItem(localStorageKey)) || []; // Retrieve ships from localStorage
    const timelineContainer = document.getElementById(timelineContainerId);

    if (!timelineContainer) {
        console.error(`Timeline container with ID ${timelineContainerId} not found.`);
        return;
    }

    if (ships.length === 0) {
        timelineContainer.innerHTML = '<p>No ship data available.</p>';
        return;
    }

    let lastPosition = 0; // Track the last position to avoid overlap
    const interval = 15; // Interval between each event

    // Group ships by their stayStart and stayEnd dates
    const groupedShips = {};
    ships.forEach(ship => {
        const stayStart = new Date(ship.stayStart).toLocaleDateString();
        const stayEnd = new Date(ship.stayEnd).toLocaleDateString();
        const key = `${stayStart}-${stayEnd}`;

        if (!groupedShips[key]) {
            groupedShips[key] = [];
        }
        groupedShips[key].push(ship);
    });

    // Render the grouped ships
    for (const key in groupedShips) {
        const shipGroup = groupedShips[key];
        const stayStart = new Date(shipGroup[0].stayStart);
        const stayEnd = new Date(shipGroup[0].stayEnd);
        const stayStartPosition = lastPosition; // Calculate position based on interval

        // Create event for stayStart (arrival)
        const startEventDiv = document.createElement('div');
        startEventDiv.className = 'event';
        startEventDiv.style.left = `${stayStartPosition}%`;
        startEventDiv.innerHTML = `
            <div class="start-date">${stayStart.toLocaleDateString()}</div>
            <div class="arrow up-arrow"><i class="fas fa-arrow-up"></i></div>
            <div class="ship-list">
                <ul>
                    ${shipGroup.map(ship => `<li>${ship.shipName} (${ship.loa} m)</li>`).join('')}
                </ul>
            </div>
        `;
        timelineContainer.appendChild(startEventDiv);

        // Create event for stayEnd (departure)
const endEventDiv = document.createElement('div');
endEventDiv.className = 'event';
const stayEndPosition = stayStartPosition + interval; // Position for departure
endEventDiv.style.left = `${stayEndPosition}%`;
endEventDiv.innerHTML = `
    <div class="arrow down-arrow"><i class="fas fa-arrow-down"></i></div>
    <div class="date">${stayEnd.toLocaleDateString()}</div> <!-- Adjust top value as needed -->
`;
timelineContainer.appendChild(endEventDiv);

        // Update lastPosition to the current position plus the interval
        lastPosition = stayEndPosition + interval;
    }
}

// Call the function to render the timeline for each dock
renderTimeline('timelineContainerIrian', 'ships'); // For Dock Irian
renderTimeline('timelineContainerSurabaya', 'ships_sby'); // For Dock Surabaya
renderTimeline('timelineContainerRepair', 'ships_floating'); // For Floating Repair

// Function to print the page
function printPage() {
    window.print();
}

// Add event listener to the print button
document.getElementById('printButton').addEventListener('click', printPage);


// Print functionality
document.getElementById('printButton').addEventListener('click', function() {
    window.print();
});
