
// Handle Employee Dashboard logic
document.getElementById('vessel-progress-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    // Collect form data
    const vesselCondition = document.getElementById('vessel-condition').value;
    const vesselPlacement = document.getElementById('vessel-placement').value;
    const arrivalTime = document.getElementById('arrival-time').value;
    const departureTime = document.getElementById('departure-time').value;
    const contractId = document.getElementById('contract-id').value;

    // Logic to store and handle employee data
    alert('Progress submitted for Vessel: ${vesselCondition}');
});
 