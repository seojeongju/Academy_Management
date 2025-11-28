// Node.js v18+ has built-in fetch

const API_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

async function testStudentFlow() {
    try {
        console.log('🚀 Starting Student Flow Test...');

        // 1. Login as Admin
        console.log('1️⃣ Logging in as Admin...');
        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        const adminData = await adminLoginRes.json();
        const adminToken = adminData.data.token;
        console.log('✅ Admin logged in');

        // 2. Create Student User
        console.log('2️⃣ Creating Student User...');
        const studentUser = {
            username: 'student_test_final_v6',
            password: 'password123',
            name: '홍길동',
            email: 'student_final_v6@test.com',
            role: 'student',
            phone: '010-1234-5678'
        };

        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentUser)
        });
        const registerData = await registerRes.json();

        let studentToken;
        let studentUserId;

        if (registerData.success) {
            console.log('✅ Student user created');
            studentToken = registerData.data.token;
            studentUserId = registerData.data.user.id;
        } else {
            console.log('ℹ️ Student user might already exist, logging in...');
            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: studentUser.username, password: studentUser.password })
            });
            const loginData = await loginRes.json();
            if (!loginData.success) throw new Error('Failed to login student: ' + loginData.message);
            studentToken = loginData.data.token;
            studentUserId = loginData.data.user.id;
            console.log('✅ Student logged in');
        }

        // 3. Create Trainee Profile and Link to User
        console.log('3️⃣ Creating/Updating Trainee Profile...');
        const traineeData = {
            name: '홍길동',
            trainee_type: 'job_seeker',
            phone: '010-1234-5678',
            email: 'student_final_v6@test.com'
        };

        const createTraineeRes = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(traineeData)
        });
        const createTraineeData = await createTraineeRes.json();
        const traineeId = createTraineeData.data.id;
        console.log('✅ Trainee profile created:', traineeId);

        const updateTraineeRes = await fetch(`${API_URL}/students/${traineeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ user_id: studentUserId })
        });
        const updateTraineeData = await updateTraineeRes.json();
        console.log('✅ Trainee linked to User');

        // 4. Verifying Student Dashboard Access
        console.log('5️⃣ Verifying Student Dashboard Access...');
        const dashboardRes = await fetch(`${API_URL}/exam-submissions/available`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${studentToken}`
            }
        });
        const dashboardData = await dashboardRes.json();

        if (dashboardData.success) {
            console.log('✅ Student dashboard access successful');
            console.log('Available Exams:', dashboardData.data);
        } else {
            console.error('❌ Failed to access dashboard:', dashboardData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testStudentFlow();
