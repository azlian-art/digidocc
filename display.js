// =====================================================
// DIGIDOCC - DOCK SPACE MANAGEMENT
// Schedule / Timeline Controller
// =====================================================


// =====================================================
// 1. FORMAT DATE
// =====================================================

function formatDate(date) {
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// =====================================================
// 2. GET DATA FROM LOCAL STORAGE
// =====================================================

function getStorageData(key) {

    try {

        const data = JSON.parse(localStorage.getItem(key));

        if (!Array.isArray(data)) {
            return [];
        }

        return data;

    } catch (error) {

        console.error(`Error reading localStorage key: ${key}`, error);

        return [];
    }
}


// =====================================================
// 3. RENDER TIMELINE
// =====================================================

function renderTimeline(timelineContainerId, localStorageKey) {

    const timelineContainer =
        document.getElementById(timelineContainerId);

    if (!timelineContainer) {

        console.error(
            `Timeline container with ID "${timelineContainerId}" not found.`
        );

        return;
    }


    // Get ship data
    const ships = getStorageData(localStorageKey);


    // Clear previous content
    timelineContainer.innerHTML = "";


    // =================================================
    // IF NO DATA
    // =================================================

    if (ships.length === 0) {

        timelineContainer.innerHTML = `
            <div class="empty-schedule">
                No schedule data available.
            </div>
        `;

        return;
    }


    // =================================================
    // TIMELINE LINE
    // =================================================

    const line = document.createElement("div");

    line.className = "line";

    timelineContainer.appendChild(line);


    // =================================================
    // SORT SHIPS BY START DATE
    // =================================================

    ships.sort((a, b) => {

        return new Date(a.stayStart) - new Date(b.stayStart);

    });


    // =================================================
    // CREATE EVENTS
    // =================================================

    ships.forEach((ship, index) => {

        const stayStart = new Date(ship.stayStart);

        const stayEnd = new Date(ship.stayEnd);


        // Skip invalid dates
        if (
            isNaN(stayStart.getTime()) ||
            isNaN(stayEnd.getTime())
        ) {

            console.warn(
                "Invalid schedule date:",
                ship
            );

            return;
        }


        // =================================================
        // CALCULATE POSITION
        // =================================================

        /*
            The position is calculated based on the order
            of the ship in the schedule.

            This keeps the current prototype stable while
            allowing the timeline to be upgraded later
            into a true calendar-based timeline.
        */

        const totalShips = ships.length;

        let position;

        if (totalShips === 1) {

            position = 45;

        } else {

            position =
                5 +
                (index / (totalShips - 1)) * 80;

        }


        // =================================================
        // CREATE START EVENT
        // =================================================

        const startEvent = document.createElement("div");

        startEvent.className = "event";

        startEvent.style.left = `${position}%`;


        // =================================================
        // SHIP INFORMATION
        // =================================================

        const shipName =
            ship.shipName || "Unknown Vessel";

        const loa =
            ship.loa
                ? `${ship.loa} m`
                : "-";


        startEvent.innerHTML = `

            <div class="start-date">
                ${formatDate(stayStart)}
            </div>

            <div class="arrow up-arrow">
                <i class="fas fa-arrow-up"></i>
            </div>

            <div class="ship-list">

                <ul>

                    <li>
                        <strong>${shipName}</strong>
                        (${loa})
                    </li>

                </ul>

            </div>

        `;


        timelineContainer.appendChild(startEvent);


        // =================================================
        // CREATE END EVENT
        // =================================================

        const endEvent = document.createElement("div");

        endEvent.className = "event";


        /*
            Departure is placed slightly to the right
            of arrival.
        */

        let endPosition = position + 8;


        // Prevent event from going beyond timeline
        if (endPosition > 90) {

            endPosition = 90;

        }


        endEvent.style.left = `${endPosition}%`;


        endEvent.innerHTML = `

            <div class="arrow down-arrow">
                <i class="fas fa-arrow-down"></i>
            </div>

            <div class="date">
                ${formatDate(stayEnd)}
            </div>

        `;


        timelineContainer.appendChild(endEvent);

    });
}

// Call the function to render the timeline for each dock
renderTimeline('timelineContainerBluga', 'ships'); // For Dock Bluga
renderTimeline('timelineContainerSurabaya', 'ships_sby'); // For Dock Surabaya
renderTimeline('timelineContainerRepair', 'ships_floating'); // For Floating Repair

// =====================================================
// 4. RENDER ALL DOCKS
// =====================================================

renderTimeline(
    "timelineContainerIrian",
    "ships"
);

renderTimeline(
    "timelineContainerSurabaya",
    "ships_sby"
);

renderTimeline(
    "timelineContainerRepair",
    "ships_floating"
);


// =====================================================
// 5. CHECK WORKSHOP BOOKING
// =====================================================

function checkWorkshopBooking() {

    const requestId =
        localStorage.getItem("bookingRequestId");

    const status =
        localStorage.getItem("bookingStatus");

    const companyName =
        localStorage.getItem("companyName");

    const vesselName =
        localStorage.getItem("vesselName");

    const facility =
        localStorage.getItem("facility");

    const startDate =
        localStorage.getItem("startDate");

    const duration =
        localStorage.getItem("duration");


    // If there is no booking request,
    // nothing needs to be displayed.

    if (!requestId) {

        console.log(
            "No workshop booking request found."
        );

        return;
    }


    console.log(
        "Workshop Booking Found:",
        {
            requestId,
            status,
            companyName,
            vesselName,
            facility,
            startDate,
            duration
        }
    );

}


// Run booking check
checkWorkshopBooking();


// =====================================================
// 6. PRINT PAGE
// =====================================================
const printButton = document.getElementById("printButton");

if (printButton) {
    printButton.addEventListener("click", function () {
        window.print();
    });
}