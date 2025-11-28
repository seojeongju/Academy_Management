import api from './services/api.js';
import { state } from './utils/state.js';
import { getRoleText } from './utils/helpers.js';
import { initAuth, checkAuth } from './modules/auth.js';
import { loadDashboard, loadStudentDashboard } from './modules/dashboard.js';
import { loadStudents, initStudentModule } from './modules/students.js';
import { loadConsultations, initConsultationModule } from './modules/consultations.js';

// DOM elements
const loginPage = document.getElementById('loginPage');
const mainApp = document.getElementById('mainApp');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    initAuth(showMainApp, showLoginPage);
    initStudentModule();
    initConsultationModule();

    // Check auth
    checkAuth(showMainApp, showLoginPage);

    // Close modal buttons (Global)
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        });
    });
});

// Show login page
function showLoginPage() {
    loginPage.style.display = 'flex';
    mainApp.style.display = 'none';
    document.getElementById('loginForm').reset();
}

// Login Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const showLoginModalBtn = document.getElementById('showLoginModalBtn');
    const loginModal = document.getElementById('loginModal');

    if (showLoginModalBtn && loginModal) {
        showLoginModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
        });
    }
});

// Show main app
function showMainApp() {
    loginPage.style.display = 'none';
    mainApp.style.display = 'grid';

    if (state.user) {
        userName.textContent = state.user.name;
        userRole.textContent = getRoleText(state.user.role);

        // Student menu control
        const navItems = document.querySelectorAll('.nav-item');
        if (state.user.role === 'student') {
            navItems.forEach(item => {
                if (item.dataset.page !== 'dashboard') {
                    item.style.display = 'none';
                }
            });
        } else {
            navItems.forEach(item => item.style.display = 'flex');
        }
    }

    // Reset content sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    // Load initial page
    if (state.user && state.user.role === 'student') {
        document.getElementById('studentDashboardContent').classList.add('active');
        loadPageData('dashboard');
    } else {
        document.getElementById('dashboardContent').classList.add('active');
        loadPageData('dashboard');
    }
}

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show corresponding content
        const page = item.dataset.page;
        contentSections.forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(`${page}Content`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = item.textContent.trim();
        }

        // Load page data
        loadPageData(page);
    });
});

// Load page data
async function loadPageData(page) {
    if (state.user && state.user.role === 'student') {
        if (page === 'dashboard') {
            await loadStudentDashboard();
        }
        return;
    }

    switch (page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'students':
            await loadStudents();
            break;
        case 'consultations':
            await loadConsultations();
            break;
        case 'exambank':
            await loadExamQuestions();
            break;
        case 'exams':
            await loadExams();
            break;
    }
}
