const signupForm = document.getElementById('signupForm');
const signupMessage = document.getElementById('signup-message');

function readAccounts() {
    try {
        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
        console.error('Could not read local account cache', error);
        throw new Error('Saved browser account data could not be read.');
    }
}

function writeAccounts(accounts) {
    try {
        localStorage.setItem('accounts', JSON.stringify(accounts));
    } catch (error) {
        console.error('Could not update local account cache', error);
        throw new Error('The browser account cache could not be updated.');
    }
}

signupForm.addEventListener('submit', async event => {
    event.preventDefault();

    const userType = document.getElementById('userType').value;
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const idNumber = document.getElementById('id').value.trim().toUpperCase();
    const password = document.getElementById('password').value;
    if (!userType || !username || !email || !idNumber || !password) {
        signupMessage.textContent = 'Please fill in all fields.';
        return;
    }

    signupMessage.textContent = 'Creating account...';
    signupForm.querySelector('button[type="submit"]').disabled = true;

    try {
        let response;
        try {
            response = await fetch('./api/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    id_number: idNumber,
                    user_type: userType
                })
            });
        } catch (error) {
            const accounts = readAccounts();
            if (accounts.some(account =>
                account.username === username ||
                account.id === idNumber ||
                String(account.email || '').toLowerCase() === email.toLowerCase()
            )) {
                throw new Error('Username, ID, or email already registered in this browser.');
            }
            accounts.push({ username, email, password, id: idNumber, userType, browserOnly: true });
            writeAccounts(accounts);
            signupMessage.textContent = 'Database unavailable; account saved only in this browser and has not been registered in MySQL.';
            return;
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Registration failed.');
        }

        try {
            const accounts = readAccounts();
            if (!accounts.some(account => account.username === username && account.id === idNumber)) {
                accounts.push({
                    username,
                    email,
                    id: idNumber,
                    userType,
                    databaseId: result.user_id
                });
                writeAccounts(accounts);
            }
        } catch (error) {
            signupMessage.textContent =
                `Account created in the database, but browser cache update failed: ${error.message}`;
            return;
        }
        signupMessage.textContent = 'Account created in the database and cached in this browser. You can now log in.';
        signupForm.reset();
    } catch (error) {
        signupMessage.textContent = error.message;
    } finally {
        signupForm.querySelector('button[type="submit"]').disabled = false;
    }
});