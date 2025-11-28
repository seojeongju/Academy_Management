import api from '../services/api.js';
import { state } from '../utils/state.js';

export function initAuth(onLoginSuccess, onLogout) {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Login handler
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await api.login({ username, password });
            state.user = response.data.user;
            api.setToken(response.data.token);

            alert('로그인 성공!');
            onLoginSuccess();
        } catch (error) {
            alert(error.message || '로그인에 실패했습니다.');
        }
    });

    // Logout handler
    logoutBtn?.addEventListener('click', () => {
        api.clearToken();
        state.user = null;
        alert('로그아웃되었습니다.');
        onLogout();
    });
}

export async function checkAuth(onLoginSuccess, onLogout) {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            api.setToken(token);
            const response = await api.getMe();
            state.user = response.data;
            onLoginSuccess();
        } catch (error) {
            console.error('Failed to load user:', error);
            onLogout();
        }
    } else {
        onLogout();
    }
}
