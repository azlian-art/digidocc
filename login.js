
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost/digidocc/api' : './api';

let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

function ensureLocalAdmin() {
    const adminExists = accounts.some(acc => acc.username === 'admin' && acc.userType === 'admin');
    if (!adminExists) {
        accounts.push({
            username: 'admin',
            password: 'admin123',
            id: 'ADM',
            userType: 'admin'
        });
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }
}

async function apiRequest(endpoint, options = {}, fallbackValue = null) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const text = await response.text();
        const payload = text ? JSON.parse(text) : {};

        if (!response.ok) {
            throw new Error(payload.message || 'Request failed');
        }

        return payload;
    } catch (error) {
        if (fallbackValue !== null) {
            return fallbackValue;
        }
        throw error;
    }
}

function localFallbackLogin(username, password, id, userType) {
    const localAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const account = localAccounts.find(acc =>
        acc.username === username &&
        acc.password === password &&
        acc.id === id &&
        acc.userType === userType
    );

    return account || null;
}

function localFallbackRegister(username, password, id, userType) {
    const localAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const duplicate = localAccounts.some(acc => acc.username === username || acc.id === id);
    if (duplicate) return { success: false, message: 'Username or ID already registered!' };

    const newAccount = { username, password, id, userType };
    localAccounts.push(newAccount);
    localStorage.setItem('accounts', JSON.stringify(localAccounts));
    return { success: true, message: 'Account created successfully!', account: newAccount };
}

ensureLocalAdmin();

document.getElementById('toggle-link').addEventListener('click', function (e) {
    e.preventDefault();
    const loginForm = document.getElementById('login-form');
    const signUpForm = document.getElementById('sign-up-form');
    const formTitle = document.getElementById('form-title');
    const toggleText = document.getElementById('toggle-link');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        signUpForm.style.display = 'none';
        formTitle.textContent = 'Login';
        toggleText.textContent = "Don't have an account? Sign Up";
    } else {
        loginForm.style.display = 'none';
        signUpForm.style.display = 'block';
        formTitle.textContent = 'Sign Up';
        toggleText.textContent = "Already have an account? Login";
    }
});

document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    let username = document.getElementById('login-username').value.trim();
    let password = document.getElementById('login-password').value;
    let id = document.getElementById('login-id').value.trim().toUpperCase();
    let userType = document.getElementById('user-type-login').value;

    const isAdminLogin = (
        userType === 'employee' &&
        username.toLowerCase() === 'admin' &&
        password === 'admin123' &&
        id === 'ADM'
    );

    if (isAdminLogin) {
        userType = 'admin';
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('feedback-message').textContent = '';

    try {
        const response = await apiRequest('/login.php', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                id_number: id,
                user_type: userType
            })
        }, null);

        document.getElementById('loading').style.display = 'none';

        if (response && response.success) {
            document.getElementById('feedback-message').textContent = 'Login successful!';
            document.getElementById('feedback-message').style.color = 'green';

            setTimeout(() => {
                if (userType === 'admin') {
                    tampilkanPanelAdmin();
                } else if (userType === 'employee') {
                    window.location.href = 'dashboard.html';
                } else if (userType === 'customer') {
                    window.location.href = 'menu.html';
                }
            }, 1000);
            return;
        }

        throw new Error(response && response.message ? response.message : 'Invalid credentials');
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        const fallbackAccount = localFallbackLogin(username, password, id, userType);

        if (fallbackAccount) {
            document.getElementById('feedback-message').textContent = 'Login successful!';
            document.getElementById('feedback-message').style.color = 'green';

            setTimeout(() => {
                if (userType === 'admin') {
                    tampilkanPanelAdmin();
                } else if (userType === 'employee') {
                    window.location.href = 'dashboard.html';
                } else if (userType === 'customer') {
                    window.location.href = 'menu.html';
                }
            }, 1000);
            return;
        }

        document.getElementById('feedback-message').textContent = error.message || 'Invalid credentials. Please try again.';
        document.getElementById('feedback-message').style.color = 'red';
    }
});

document.getElementById('sign-up-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const id = document.getElementById('signup-id').value.trim();
    const userType = document.getElementById('user-type-signup').value;

    const isEmployeeValid = userType === 'employee' && id.length === 3 && parseInt(id[2]) % 2 !== 0;
    const isCustomerValid = userType === 'customer' && id.length === 6 && parseInt(id[5]) % 2 === 0;

    if (!isEmployeeValid && !isCustomerValid) {
        document.getElementById('feedback-message').textContent = 'Invalid ID format for selected user type!';
        document.getElementById('feedback-message').style.color = 'red';
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('feedback-message').textContent = '';

    try {
        const response = await apiRequest('/register.php', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                id_number: id,
                user_type: userType
            })
        }, null);

        document.getElementById('loading').style.display = 'none';

        if (response && response.success) {
            document.getElementById('feedback-message').textContent = 'Account created successfully!';
            document.getElementById('feedback-message').style.color = 'green';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        throw new Error(response && response.message ? response.message : 'Registration failed');
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        const fallbackResult = localFallbackRegister(username, password, id, userType);

        if (fallbackResult.success) {
            document.getElementById('feedback-message').textContent = 'Account created successfully!';
            document.getElementById('feedback-message').style.color = 'green';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        document.getElementById('feedback-message').textContent = fallbackResult.message || error.message || 'Registration failed';
        document.getElementById('feedback-message').style.color = 'red';
    }
});

async function tampilkanPanelAdmin() {
    const adminPanelHTML = `
        <h2>📋 Admin Panel: Daftar Akun</h2>
        <table border="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>ID</th>
                    <th>Password</th>
                    <th>User Type</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody id="admin-table-body"></tbody>
        </table>
        <br>
        <button onclick="hapusSemuaAkun()">🗑️ Hapus Semua Akun</button>
        <button onclick="location.reload()">🔙 Kembali ke Login</button>
    `;
    document.body.innerHTML = adminPanelHTML;

    const tbody = document.getElementById('admin-table-body');
    try {
        const result = await apiRequest('/users.php', { method: 'GET' }, {
            success: true,
            data: JSON.parse(localStorage.getItem('accounts')) || []
        });

        const akun = (result && result.data) ? result.data : [];

        akun.forEach((acc, index) => {
            const row = document.createElement('tr');
            const isAdmin = (acc.username || '').toLowerCase() === 'admin' && (acc.userType || acc.user_type || '') === 'admin';
            const visibleId = acc.id || acc.id_number || '';
            const visiblePass = acc.password || '***';
            const visibleType = acc.userType || acc.user_type || 'employee';
            row.innerHTML = `
                <td>${acc.username}</td>
                <td>${visibleId}</td>
                <td>${visiblePass}</td>
                <td>${visibleType}</td>
                <td>${isAdmin ? '🛡️' : '<button onclick="hapusAkun(' + index + ')">Hapus</button>'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const akun = JSON.parse(localStorage.getItem('accounts')) || [];
        akun.forEach((acc, index) => {
            const row = document.createElement('tr');
            const isAdmin = acc.username === 'admin' && acc.userType === 'admin';
            row.innerHTML = `
                <td>${acc.username}</td>
                <td>${acc.id}</td>
                <td>${acc.password}</td>
                <td>${acc.userType}</td>
                <td>${isAdmin ? '🛡️' : '<button onclick="hapusAkun(' + index + ')">Hapus</button>'}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

function hapusAkun(index) {
    let akun = JSON.parse(localStorage.getItem('accounts')) || [];

    if (akun[index].username === 'admin' && akun[index].userType === 'admin') {
        alert("Akun admin tidak dapat dihapus.");
        return;
    }

    if (confirm(`Yakin ingin menghapus akun "${akun[index].username}"?`)) {
        akun.splice(index, 1);
        localStorage.setItem('accounts', JSON.stringify(akun));
        tampilkanPanelAdmin();
    }
}

function hapusSemuaAkun() {
    if (confirm("Hapus semua akun?")) {
        localStorage.removeItem('accounts');
        location.reload();
    }
}
