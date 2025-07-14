// Check if accounts are stored in localStorage, if not initialize an empty array
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

// Toggle between Login and Sign Up forms
document.getElementById('toggle-link').addEventListener('click', function(e) {
    e.preventDefault();
    const loginForm = document.getElementById('login-form');
    const signUpForm = document.getElementById('sign-up-form');
    const formTitle = document.getElementById('form-title');
    const toggleText = document.getElementById('toggle-link');
    
    if (loginForm.style.display === 'none') {
        // Switch to login form
        loginForm.style.display = 'block';
        signUpForm.style.display = 'none';
        formTitle.textContent = 'Login';
        toggleText.textContent = "Don't have an account? Sign Up";
    } else {
        // Switch to sign-up form
        loginForm.style.display = 'none';
        signUpForm.style.display = 'block';
        formTitle.textContent = 'Sign Up';
        toggleText.textContent = "Already have an account? Login";
    }
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const id = document.getElementById('login-id').value;
    const userType = document.getElementById('user-type-login').value;

    // Show loading spinner
    document.getElementById('loading').style.display = 'block';
    document.getElementById('feedback-message').textContent = ''; // Clear any previous feedback message

    // Simulate checking credentials
    setTimeout(function() {
        // Hide loading spinner
        document.getElementById('loading').style.display = 'none';

        // Check if account exists
        const account = accounts.find(acc => acc.username === username && acc.password === password && acc.id === id && acc.userType === userType);

        if (account) {
            // Successful login
            document.getElementById('feedback-message').textContent = 'Login successful! Redirecting...';
            document.getElementById('feedback-message').style.color = 'green';

            // Redirect based on user type
            setTimeout(function() {
                if (userType === 'employee') {
                    window.location.href = 'dashboard.html'; // Redirect to employee page
                } else if (userType === 'customer') {
                    window.location.href = 'menu.html'; // Redirect to customer page
                }
            }, 1000); // Wait 1 second before redirecting
        } else {
            // Failed login
            document.getElementById('feedback-message').textContent = 'Invalid credentials. Please try again.';
            document.getElementById('feedback-message').style.color = 'red';
        }
    }, 1500); // Simulate network delay (replace with real async logic if needed)
});

// Handle sign-up form submission
document.getElementById('sign-up-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const id = document.getElementById('signup-id').value;
    const userType = document.getElementById('user-type-signup').value;

    // Validate ID format based on user type
    if (userType === 'employee' && id.length === 3 && parseInt(id.charAt(2)) % 2 !== 0) {
        // Valid Employee ID
    } else if (userType === 'customer' && id.length === 6 && parseInt(id.charAt(5)) % 2 === 0) {
        // Valid Customer ID
    } else {
        document.getElementById('feedback-message').textContent = 'Invalid ID format for selected user type!';
        document.getElementById('feedback-message').style.color = 'red';
        return;
    }

    // Store new account information
    const newAccount = {
        username: username,
        password: password,
        id: id,
        userType: userType
    };

    accounts.push(newAccount);
    localStorage.setItem('accounts', JSON.stringify(accounts));

    // Display feedback and redirect to login
    document.getElementById('feedback-message').textContent = 'Account created successfully!';
    document.getElementById('feedback-message').style.color = 'green';

    setTimeout(function() {
        window.location.href = 'login.html'; // Redirect to login page
    }, 1500);
});

