// Map.js

// **Variables**
const zoomInButton = document.querySelector('.zoom-in');
const zoomOutButton = document.querySelector('.zoom-out');
const zoomValueDisplay = document.querySelector('.zoom-value');
const sidePanel = document.querySelector('.side-panel');
const closeButton = document.querySelector('.close-btn');
const loadingIndicator = document.querySelector('.Loading');
const svgElement = document.querySelector('svg');
let zoomLevel = 1;

// **Data Structure for Dock Information**
const dockData = {
    'ID-AC': { Name: 'Aceh Dock', length: '200m', width: '30m', vessel: 'Vessel A' },
    'ID-BA': { Name: 'Bali Dock', length: '150m', width: '25m', vessel: 'Vessel B' },
    'ID-BB': { Name: 'Bangka Dock', length: '180m', width: '28m', vessel: 'Vessel C' },
    'ID-BE': { Name: 'Bengkulu Dock', length: '220m', width: '35m', vessel: 'Vessel D' },
    'ID-BT': { Name: 'Banten Dock', length: '160m', width: '20m', vessel: 'Vessel E' },
    'ID-JA': { Name: 'Jambi Dock', length: '190m', width: '32m', vessel: 'Vessel F' },
    'ID-JB': { Name: 'Jakarta Dock', length: '210m', width: '40m', vessel: 'Vessel G' },
    'ID-KB': { Name: 'Kalimantan Barat Dock', length: '250m', width: '45m', vessel: 'Vessel H' },
    'ID-KI': { Name: 'Kalimantan Timur Dock', length: '300m', width: '50m', vessel: 'Vessel I' },
    'ID-KT': { Name: 'Kalimantan Tengah Dock', length: '280m', width: '48m', vessel: 'Vessel J' },
    'ID-KU': { Name: 'Kalimantan Utara Dock', length: '230m', width: '38m', vessel: 'Vessel K' },
    'ID-MA': { Name: 'Maluku Dock', length: '240m', width: '42m', vessel: 'Vessel L' },
    'ID-MU': { Name: 'Maluku Utara Dock', length: '260m', width: '46m', vessel: 'Vessel M' },
    'ID-NB': { Name: 'Nusa Barat Dock', length: '170m', width: '29m', vessel: 'Vessel N' },
    'ID-NT': { Name: 'Nusa Timur Dock', length: '190m', width: '33m', vessel: 'Vessel O' },
    'ID-PB': { Name: 'Papua Dock', length: '210m', width: '37m', vessel: 'Vessel P' },
    'ID-PA': { Name: 'Papua Barat Dock', length: '230m', width: '39m', vessel: 'Vessel Q' },
    'ID-RI': { Name: 'Riau Dock', length: '250m', width: '41m', vessel: 'Vessel R' },
    'ID-SB': { Name: 'Sumatera Barat Dock', length: '220m', width: '36m', vessel: 'Vessel S' },
    'ID-SN': { Name: 'Sumatera Selatan Dock', length: '240m', width: '44m', vessel: 'Vessel T' },
    'ID-ST': { Name: 'Sumatera Tengah Dock', length: '260m', width: '47m', vessel: 'Vessel U' },
    'ID-SG': { Name: 'Sulawesi Garuda Dock', length: '280m', width: '49m', vessel: 'Vessel V' },
    'ID-YO': { Name: 'Yogyakarta Dock', length: '300m', width: '52m', vessel: 'Vessel W' },
    // Add more regions as needed...
};


// **Functions**
const updateZoomValue = () => {
    zoomValueDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    svgElement.style.transform = `scale(${zoomLevel})`;

};

const zoomIn = () => {
    zoomLevel += 0.1;
    updateZoomValue();
};

const zoomOut = () => {
    if (zoomLevel > 0.1) {
        zoomLevel -= 0.1;
        updateZoomValue();
    }
};

const toggleSidePanel = () => {
    sidePanel.classList.toggle('side-panel-open');
    loadingIndicator.classList.toggle('hide');
};


// **Function to handle SVG path click**
const handlePathClick = (event) => {
    const pathId = event.target.getAttribute('id');
    const dockInfo = dockData[pathId];

    if (dockInfo) {
        // Update side panel content based on the clicked path
        const dockName = sidePanel.querySelector('.Name')
        const dockLength = sidePanel.querySelector('.Area');
        const dockWidth = sidePanel.querySelector('.area');
        const vesselDocked = sidePanel.querySelector('.unit');

        dockName.textContent = dockInfo.Name;
        dockLength.textContent = dockInfo.length;
        dockWidth.textContent = dockInfo.width;
        vesselDocked.textContent = dockInfo.vessel;

        toggleSidePanel(); // Open the side panel
    }
};

// **Event Listeners**
zoomInButton.addEventListener('click', zoomIn);
zoomOutButton.addEventListener('click', zoomOut);
closeButton.addEventListener('click', toggleSidePanel);

// Add click event listeners to all SVG paths
const paths = svgElement.querySelectorAll('path');
paths.forEach(path => {
    path.addEventListener('click', handlePathClick);
});

// **Initial Setup**
updateZoomValue();