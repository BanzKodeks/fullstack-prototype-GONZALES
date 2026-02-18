let currentUser = null;

window.db = {
    accounts: []
};

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
        case '#/profile':
            document.getElementById('profilePage').classList.add('active');
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