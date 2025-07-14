document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const userType = document.getElementById('userType').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const id = document.getElementById('id').value;

    // Here you can add your login logic (e.g., API call)
    console.log(`User  Type: ${userType}, Username: ${username}, Password: ${password}, ID: ${id}`);

    // For demonstration, we'll just alert the user
    alert(`Logged in as ${userType}: ${username}`);
});