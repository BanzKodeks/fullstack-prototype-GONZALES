const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;


//ROUTING
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || '#/';

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    })

    const protectedRoutes = ['#/profile', '#/requests'];

    const adminRoutes = ['#/accounts', '#/departments', '#/employees'];

    if (protectedRoutes.includes(hash) && !currentUser) {
        navigateTo('#/login');
        return;
    }

    if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
        navigateTo("#/");
        return;
    }

    switch (hash) {
        case '#/':
            document.getElementById('homePage').classList.add('active');
            break;
        case '#/login':
            document.getElementById('loginPage').classList.add('active');
            break;
        case '#/register':
            document.getElementById('registerPage').classList.add('active');
            break;
        case "#/profile":
            document.getElementById("profilePage").classList.add("active");
            renderProfile();
        break;
        case '#/verify-email':
            document.getElementById('verify-email').classList.add('active');

            let storedEmail = localStorage.getItem("unverified_email");
            document.getElementById("verifyUserEmail").textContent = storedEmail;

            break;
        case "#/accounts":
            document.getElementById("accountsPage").classList.add("active");
            renderAccountsList();
        break;
        case "#/departments":
            document.getElementById("departmentPage").classList.add("active");
            renderDepartmentsList();
        break;
        case "#/employees":
            document.getElementById("employeePage").classList.add("active");
            renderEmployeesTable();
        break;
        default:
            document.getElementById('homePage').classList.add('active');
    }
}

window.addEventListener('hashchange', handleRouting);

if (!window.location.hash) {
    navigateTo("#/");
} else {
    handleRouting();
}

// Registration
document.getElementById("btnRegister").addEventListener("click", function () {

    let email = document.getElementById("Email").value;
    let password = document.getElementById("Password").value;

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    let existing = window.db.accounts.find(acc => acc.email === email);
    if (existing) {
        alert("Email already exists.");
        return;
    }

    let newAccount = {
        firstName: document.getElementById("FirstName").value,
        lastName: document.getElementById("LastName").value,
        email: email,
        password: password,
        role: "user",
        verified: false
    };

    window.db.accounts.push(newAccount);

    saveToStorage();

    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify-email");
});


//Verify Email
document.getElementById("btnVerifyEmail").addEventListener("click", function () {

    let emailToVerify = localStorage.getItem("unverified_email");

    let account = window.db.accounts.find(acc => acc.email === emailToVerify);

    if (!account) {
        alert("Account not found.");
        return;
    }

    account.verified = true;

    saveToStorage();

    localStorage.removeItem("unverified_email");

    alert("✅ Email verified! You may now login.");
    navigateTo("#/login");
});



//Login
document.getElementById("btnLogin").addEventListener("click", function () {

    let email = document.getElementById("LoginEmail").value;
    let password = document.getElementById("LoginPassword").value;

    let user = window.db.accounts.find(acc =>
        acc.email === email &&
        acc.password === password &&
        acc.verified === true
    );

    if (!user) {
        alert("❌ Invalid login or not verified.");
        return;
    }

    localStorage.setItem("auth_token", user.email);

    setAuthState(true, user);

    navigateTo("#/profile");
});


function setAuthState(isAuth, user = null) {

    if (isAuth) {
        currentUser = user;

        document.body.classList.remove("not-authenticated");
        document.body.classList.add("authenticated");

        if (user.role === "admin") {
            document.body.classList.add("is-admin");
        } else {
            document.body.classList.remove("is-admin");
        }

    } else {
        currentUser = null;

        document.body.classList.remove("authenticated", "is-admin");
        document.body.classList.add("not-authenticated");
    }
}


function autoLogin() {

    let token = localStorage.getItem("auth_token");
    if (!token) return;

    let user = window.db.accounts.find(acc => acc.email === token);

    if (user) {
        setAuthState(true, user);
    }
}


//Logout
document.getElementById("btnLogout").addEventListener("click", function () {

    localStorage.removeItem("auth_token");
    setAuthState(false);

    navigateTo("#/");
});


//Data Persistence with localStorage
function seedDatabase() {
    return {
        accounts: [
            {
                firstName: "System",
                lastName: "Admin",
                email: "admin@example.com",
                password: "Password123!",
                role: "admin",
                verified: true
            }
        ],
        departments: [
            { name: "Engineering", description: "Software" },
            { name: "HR", description: "Human Resource" }
        ],
        employees: [],
        requests: []
    };
}


function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function loadFromStorage() {
    let rawData = localStorage.getItem(STORAGE_KEY);

    if (!rawData) {
        window.db = seedDatabase();
        saveToStorage();
        return;
    }

    try {
        window.db = JSON.parse(rawData);
    } catch {
        window.db = seedDatabase();
        saveToStorage();
    }
}


loadFromStorage();
autoLogin();
handleRouting();

window.addEventListener("hashchange", handleRouting);

//Profile 
function renderProfile() {

    if (!currentUser) {
        console.log("No user logged in. Cannot render profile.");
        return;
    }

    let nameEl = document.querySelector("#profilePage h2");
    let emailEl = document.querySelector("#verifyUserEmail"); 
    let roleEl = document.querySelector("#profilePage p:nth-of-type(3)");

    let firstName = currentUser.firstName;
    let lastName = currentUser.lastName;
    let fullName = firstName + " " + lastName;

    nameEl.textContent = fullName;

    if (emailEl) {
        emailEl.textContent = currentUser.email;
    }

    let role = currentUser.role; 
    let capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);

    roleEl.textContent = "Role: " + capitalizedRole;

    let editBtn = document.querySelector("#profilePage .btn-profile button");

    editBtn.replaceWith(editBtn.cloneNode(true));
    editBtn = document.querySelector("#profilePage .btn-profile button");

    editBtn.addEventListener("click", function () {
        alert("Edit Profile feature coming soon!");
    });
}

//Accounts
function renderAccountsList() {

    let tbody = document.getElementById("accountsTableBody");
    
    tbody.innerHTML = "";

    if (window.db.accounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No accounts found.
                </td>
            </tr>
        `;
        return;
    }

     window.db.accounts.forEach((acc, index) => {
        let verifiedText = acc.verified ? "✅" : "—";

        tbody.innerHTML += `
            <tr>
                <td>${acc.firstName} ${acc.lastName}</td>
                <td>${acc.email}</td>
                <td>${acc.role}</td>
                <td>${verifiedText}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"
                        onclick="editAccount(${index})">
                        Edit
                    </button>

                    <button class="btn btn-sm btn-outline-warning"
                        onclick="resetPassword(${index})">
                        Reset PW
                    </button>

                    <button class="btn btn-sm btn-outline-danger"
                        onclick="deleteAccount(${index})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

function resetPassword(index) {

    let newPassword = prompt("Enter new password (min 6 chars):");

    if (!newPassword || newPassword.length < 6) {
        alert("❌ Password must be at least 6 characters.");
        return;
    }

    window.db.accounts[index].password = newPassword;

    saveToStorage();
    alert("✅ Password reset successfully.");
}

function deleteAccount(index) {

    let acc = window.db.accounts[index];

    if (currentUser.email === acc.email) {
        alert("❌ You cannot delete your own account.");
        return;
    }

    let confirmDelete = confirm("Are you sure you want to delete this account?");

    if (!confirmDelete) return;

    window.db.accounts.splice(index, 1);

    saveToStorage();
    renderAccountsList();

    alert("✅ Account deleted.");
}

let editingAccountIndex = null;

function editAccount(index) {

    let acc = window.db.accounts[index];

    document.getElementById("Inp_AccFirstN").value = acc.firstName;
    document.getElementById("Inp_AccLastN").value = acc.lastName;
    document.getElementById("Inp_AccEmail").value = acc.email;
    document.getElementById("Inp_AccPass").value = acc.password;
    document.getElementById("Inp_AccRole").value = acc.role;
    document.getElementById("Inp_AccVerify").checked = acc.verified;

    editingAccountIndex = index;

    alert("Editing account: " + acc.email);
}

//Department
function renderDepartmentsList() {

    let tbody = document.getElementById("departmentsTableBody");

    tbody.innerHTML = "";

    window.db.departments.forEach(dept => {

        tbody.innerHTML += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-outline-secondary btn-sm">
                        Edit
                    </button>
                </td>
            </tr>
        `;
    });
}

//Employees
function renderEmployeesTable() {

    let tbody = document.getElementById("employeesTableBody");

    tbody.innerHTML = "";

    if (window.db.employees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No employees yet.
                </td>
            </tr>
        `;
        return;
    }

    window.db.employees.forEach(emp => {

        tbody.innerHTML += `
            <tr>
                <td>${emp.empId}</td>
                <td>${emp.email}</td>
                <td>${emp.position}</td>
                <td>${emp.department}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

document.querySelector(".btn-save-employee").addEventListener("click", function () {

    let empId = document.getElementById("Inp_EmpId").value;
    let email = document.getElementById("Inp_EmpEmail").value;
    let position = document.getElementById("Inp_EmpPos").value;
    let dept = document.getElementById("Inp_EmpDept").value;

    // Check if email exists
    let userExists = window.db.accounts.find(acc => acc.email === email);

    if (!userExists) {
        alert("❌ No account matches this email.");
        return;
    }

    // Create employee object
    let newEmployee = {
        empId: empId,
        email: email,
        position: position,
        department: dept
    };

    window.db.employees.push(newEmployee);

    saveToStorage();
    renderEmployeesTable();

    alert("✅ Employee added!");
});



