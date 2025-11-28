// import fetch from 'node-fetch'; // Node.js v18+ has built-in fetch

const API_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

async function testBatchCreate() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            throw new Error('Login failed: ' + loginData.message);
        }

        const token = loginData.data.token;
        console.log('✅ Login successful');

        // 2. Batch Create Questions
        console.log('Testing batch create questions...');
        const questions = [
            {
                type: 'multiple_choice',
                difficulty: 'medium',
                question_text: '테스트 문제 1: 다음 중 웹 표준 기술이 아닌 것은?',
                options: ['HTML', 'CSS', 'JavaScript', 'Flash'],
                correct_answer: 'Flash',
                explanation: 'Flash는 더 이상 지원되지 않는 기술입니다.',
                score_weight: 5
            },
            {
                type: 'true_false',
                difficulty: 'easy',
                question_text: '테스트 문제 2: HTML은 프로그래밍 언어이다.',
                correct_answer: 'False',
                explanation: 'HTML은 마크업 언어입니다.',
                score_weight: 5
            }
        ];

        const batchRes = await fetch(`${API_URL}/exam-questions/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questions })
        });

        const batchData = await batchRes.json();

        if (batchData.success) {
            console.log(`✅ Batch create successful: ${batchData.message}`);
            console.log('Created questions:', batchData.data.map(q => q.id));
        } else {
            throw new Error('Batch create failed: ' + batchData.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBatchCreate();
