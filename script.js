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

    const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/accounts', '#/departments'];
    const adminRoutes = ['#/accounts', '#/departments', '#/employees'];
    const publicOnlyRoutes = ['#/login', '#/register', '#/verify-email'];

    if (protectedRoutes.includes(hash) && !currentUser) {
        showToast("Access denied. Login required.", "error");
        navigateTo('#/login');
        return;
    }

    
    if (currentUser && publicOnlyRoutes.includes(hash)) {
        navigateTo('#/profile');
        return;
    }

    if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
        showToast("Access denied. Admin only.", "error");
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
            document.getElementById("departmentsPage").classList.add("active");
            renderDepartmentsList();
        break;
        case "#/requests":
            document.getElementById("requestPage").classList.add("active");
            renderMyRequests();
        break;
        case "#/employees":
            document.getElementById("employeesPage").classList.add("active");
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

    let passwordInput = document.getElementById("Password");

    if (password.length < 6) {
        passwordInput.classList.add("is-invalid");
        showToast("Password must be at least 6 characters.", "error");
        return;
    } else {
        passwordInput.classList.remove("is-invalid");
    }

    let existing = window.db.accounts.find(acc => acc.email === email);
    if (existing) {
        showToast("Email already exists.", "error");
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
    showToast("Account created successfully.");

    saveToStorage();

    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify-email");
});


//Verify Email
document.getElementById("btnVerifyEmail").addEventListener("click", function () {

    let emailToVerify = localStorage.getItem("unverified_email");

    let account = window.db.accounts.find(acc => acc.email === emailToVerify);

    if (!account) {
        showToast("Account not found.");
        return;
    }

    account.verified = true;

    saveToStorage();

    localStorage.removeItem("unverified_email");

    showToast("✅ Email verified! You may now login.");
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
        showToast("❌ Invalid login or not verified.");
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

        if (window.location.hash === "#/login" ||
            window.location.hash === "#/register") {
            navigateTo("#/profile");
        }
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

//Profile 
function renderProfile() {

    if (!currentUser) {
        console.log("No user logged in. Cannot render profile.");
        return;
    }

    let nameEl = document.querySelector("#profilePage h2");
    let emailEl = document.getElementById("profileEmail");
    emailEl.textContent = currentUser.email;
    let roleEl = document.getElementById("profileRole");

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
        showToast("Edit Profile feature coming soon!");
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
        showToast("❌ Password must be at least 6 characters.");
        return;
    }

    window.db.accounts[index].password = newPassword;

    saveToStorage();
    alert("✅ Password reset successfully.");
}

function deleteAccount(index) {

    let acc = window.db.accounts[index];

    if (currentUser.email === acc.email) {
        showToast("❌ You cannot delete your own account.");
        return;
    }

    let confirmDelete = confirm("Are you sure you want to delete this account?");

    if (!confirmDelete) return;

    window.db.accounts.splice(index, 1);

    saveToStorage();
    renderAccountsList();

    showToast("✅ Account deleted.");
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

document.querySelector(".btn_acc").addEventListener("click", function () {
    clearAccountForm();
    showToast("Fill the form below to create account.");
});

document.getElementById("btnSaveAccount").addEventListener("click", saveAccount);

function saveAccount() {

    let firstName = document.getElementById("Inp_AccFirstN").value.trim();
    let lastName = document.getElementById("Inp_AccLastN").value.trim();
    let email = document.getElementById("Inp_AccEmail").value.trim();
    let password = document.getElementById("Inp_AccPass").value.trim();
    let role = document.getElementById("Inp_AccRole").value;
    let verified = document.getElementById("Inp_AccVerify").checked;


    if (!firstName || !lastName || !email || !password) {
        alert("All fields are required.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }


    if (editingAccountIndex === null) {


        let existing = window.db.accounts.find(acc => acc.email === email);
        if (existing) {
            alert("Email already exists.");
            return;
        }

        let newAccount = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            role: role,
            verified: verified
        };

        window.db.accounts.push(newAccount);

        showToast("Account created successfully.");

    } else {

        let account = window.db.accounts[editingAccountIndex];


        let duplicate = window.db.accounts.find((acc, i) =>
            acc.email === email && i !== editingAccountIndex
        );

        if (duplicate) {
            alert("Email already exists.");
            return;
        }

        account.firstName = firstName;
        account.lastName = lastName;
        account.email = email;
        account.password = password;
        account.role = role;
        account.verified = verified;

        alert("✅ Account updated.");
    }

    saveToStorage();
    clearAccountForm();
    renderAccountsList();
}

function clearAccountForm() {

    document.getElementById("Inp_AccFirstN").value = "";
    document.getElementById("Inp_AccLastN").value = "";
    document.getElementById("Inp_AccEmail").value = "";
    document.getElementById("Inp_AccPass").value = "";
    document.getElementById("Inp_AccRole").value = "user";
    document.getElementById("Inp_AccVerify").checked = false;

    editingAccountIndex = null;
}

//Department
let editingDepartmentIndex = null;
function renderDepartmentsList() {

    let tbody = document.getElementById("departmentsTableBody");
    tbody.innerHTML = "";

    if (window.db.departments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    No departments yet.
                </td>
            </tr>
        `;
        return;
    }

    window.db.departments.forEach((dept, index) => {

        tbody.innerHTML += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-outline-secondary btn-sm"
                        onclick="editDepartment(${index})">
                        Edit
                    </button>

                    <button class="btn btn-outline-danger btn-sm"
                        onclick="deleteDepartment(${index})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

function editDepartment(index) {

    let dept = window.db.departments[index];

    let newName = prompt("Edit Department Name:", dept.name);
    if (!newName) return;

    let newDesc = prompt("Edit Description:", dept.description);
    if (!newDesc) return;

    window.db.departments[index].name = newName;
    window.db.departments[index].description = newDesc;

    saveToStorage();
    renderDepartmentsList();
    showToast("Department updated.");
}

function deleteDepartment(index) {

    if (!confirm("Delete this department?")) return;

    window.db.departments.splice(index, 1);

    saveToStorage();
    renderDepartmentsList();
    showToast("Department deleted.");
}

document.querySelector(".btn_dept").addEventListener("click", function () {

    let name = prompt("Enter Department Name:");
    if (!name) {
        showToast("Department name is required.", "error");
        return;
    }

    let description = prompt("Enter Description:");
    if (!description) {
        showToast("Description is required.", "error");
        return;
    }

    let existing = window.db.departments.find(d => d.name === name);
    if (existing) {
        showToast("Department already exists.", "error");
        return;
    }

    window.db.departments.push({
        name: name,
        description: description
    });

    saveToStorage();
    renderDepartmentsList();
    showToast("Department added successfully.");
});

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

document.querySelector(".btn-save-employee")
.addEventListener("click", function () {

    let empId = document.getElementById("Inp_EmpId").value.trim();
    let email = document.getElementById("Inp_EmpEmail").value.trim();
    let position = document.getElementById("Inp_EmpPos").value.trim();
    let dept = document.getElementById("Inp_EmpDept").value.trim();

    if (!empId || !email || !position || !dept) {
        showToast("All fields are required.", "error");
        return;
    }

    let userExists = window.db.accounts.find(acc => acc.email === email);
    if (!userExists) {
        showToast("No account matches this email.", "error");
        return;
    }

    let duplicateId = window.db.employees.find(emp => emp.empId === empId);
    if (duplicateId) {
        showToast("Employee ID already exists.", "error");
        return;
    }

    window.db.employees.push({
        empId: empId,
        email: email,
        position: position,
        department: dept
    });

    saveToStorage();
    renderEmployeesTable();
    showToast("Employee added successfully.");
});

//Request
function renderMyRequests() {

    let tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = "";

    if (!currentUser) return;

    let myRequests = window.db.requests.filter(req =>
        req.employeeEmail === currentUser.email
    );

    if (myRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    No requests yet.
                </td>
            </tr>
        `;
        return;
    }

    myRequests.forEach(req => {

        let itemsText = req.items
            .map(item => `${item.name} (x${item.qty})`)
            .join(", ");

        tbody.innerHTML += `
            <tr>
                <td>${req.date}</td>
                <td>${req.type}</td>
                <td>${itemsText}</td>
                <td>${req.status}</td>
            </tr>
        `;
    });
}
function createItemRow(name = "", qty = "") {

    let div = document.createElement("div");
    div.classList.add("d-flex", "mb-2");

    div.innerHTML = `
        <input type="text" class="form-control me-2 item-name"
            placeholder="Item Name" value="${name}">
        <input type="number" class="form-control me-2 item-qty"
            placeholder="Qty" style="width:80px" value="${qty}">
        <button type="button" class="btn btn-danger btn-sm remove-item">
            ×
        </button>
    `;

    div.querySelector(".remove-item").addEventListener("click", function () {
        div.remove();
    });

    return div;
}

document.getElementById("btnAddItem").addEventListener("click", function () {
    let container = document.getElementById("itemsContainer");
    container.appendChild(createItemRow());
});

document.getElementById("requestModal")
.addEventListener("shown.bs.modal", function () {

    let container = document.getElementById("itemsContainer");
    container.innerHTML = "";
    container.appendChild(createItemRow());
});

document.getElementById("btnSubmitRequest")
.addEventListener("click", function () {

    let type = document.getElementById("Inp_ReqType").value;

    let itemNames = document.querySelectorAll(".item-name");
    let itemQtys = document.querySelectorAll(".item-qty");

    let items = [];

    for (let i = 0; i < itemNames.length; i++) {

        let name = itemNames[i].value.trim();
        let qty = itemQtys[i].value;

        if (name && qty > 0) {
            items.push({
                name: name,
                qty: parseInt(qty)
            });
        }
    }

    if (items.length === 0) {
        alert("You must add at least one valid item.");
        return;
    }

    let newRequest = {
        type: type,
        items: items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };

    window.db.requests.push(newRequest);
    saveToStorage();

    bootstrap.Modal.getInstance(
        document.getElementById("requestModal")
    ).hide();

    renderMyRequests();
    showToast("Request submitted successfully.");
});

// Toast 
function showToast(message, type = "success") {
    const toastEl = document.getElementById("appToast");
    const toastBody = document.getElementById("toastMessage");

    toastBody.textContent = message;

    if (type === "error") {
        toastEl.classList.remove("bg-success");
        toastEl.classList.add("bg-danger", "text-white");
    } else {
        toastEl.classList.remove("bg-danger");
        toastEl.classList.add("bg-success", "text-white");
    }

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

