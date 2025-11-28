import api from '../services/api.js';
import { examState, setExamState, resetExamState } from '../utils/state.js';

export async function startExamFlow(examId) {
    if (!confirm('시험을 시작하시겠습니까?\n시험 도중 브라우저를 닫거나 이탈하면 불이익이 있을 수 있습니다.')) {
        return;
    }

    try {
        const response = await api.startExam(examId);
        const { exam, submission_id, questions } = response.data;

        // Init state
        setExamState({
            examId: exam.id,
            questions: questions,
            answers: {},
            startTime: new Date(),
            timerInterval: null,
            timeLimit: exam.time_limit * 60 // seconds
        });

        // Render UI
        document.getElementById('takingExamTitle').textContent = exam.title;
        document.getElementById('examTakingModal').classList.add('active');

        renderExamQuestions();
        renderOMR();
        startTimer();

    } catch (error) {
        console.error('Failed to start exam:', error);
        alert(error.message || '시험 시작에 실패했습니다.');
    }
}

function renderExamQuestions() {
    const container = document.getElementById('examQuestionArea');

    container.innerHTML = examState.questions.map((q, index) => `
        <div class="parsed-question-card" id="q-${q.id}">
            <h4>문제 ${index + 1} <span style="font-size: 0.9rem; font-weight: normal;">(${q.score}점)</span></h4>
            <div class="question-text">
                ${q.question_text}
            </div>
            <div class="question-options">
                ${renderQuestionInput(q, index)}
            </div>
        </div>
    `).join('');
}

function renderQuestionInput(q, index) {
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
        return `
            <div class="options-list">
                ${q.options.map((opt, i) => `
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer;">
                        <input type="radio" name="q_${q.id}" value="${i + 1}" onchange="window.markAnswer('${q.id}', '${i + 1}')">
                        <span>${i + 1}. ${opt}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else if (q.type === 'short_answer') {
        return `
            <input type="text" class="form-control" placeholder="답안을 입력하세요"
            onchange="window.markAnswer('${q.id}', this.value)" style="width: 100%; padding: 0.5rem;">
        `;
    } else {
        return `
            <textarea class="form-control" rows="3" placeholder="서술형 답안을 입력하세요"
            onchange="window.markAnswer('${q.id}', this.value)" style="width: 100%; padding: 0.5rem;"></textarea>
        `;
    }
}

function renderOMR() {
    const grid = document.getElementById('omrGrid');
    grid.innerHTML = examState.questions.map((q, index) => `
        <button class="btn btn-outline-secondary btn-sm" id="omr-${q.id}" onclick="window.scrollToQuestion('${q.id}')">
            ${index + 1}
        </button>
    `).join('');
}

function startTimer() {
    const timerEl = document.getElementById('takingExamTimer');
    let remaining = examState.timeLimit;

    updateTimerDisplay(remaining);

    const interval = setInterval(() => {
        remaining--;
        updateTimerDisplay(remaining);

        if (remaining <= 0) {
            clearInterval(interval);
            alert('시험 시간이 종료되었습니다. 답안을 제출합니다.');
            submitExamFlow();
        }
    }, 1000);

    setExamState({ timerInterval: interval });
}

function updateTimerDisplay(seconds) {
    const timerEl = document.getElementById('takingExamTimer');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    timerEl.textContent = `남은 시간: ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (seconds < 300) { // 5분 미만
        timerEl.style.color = 'red';
        timerEl.classList.add('blink');
    }
}

export async function submitExamFlow() {
    clearInterval(examState.timerInterval);

    try {
        const endTime = new Date();
        const timeTakenSeconds = Math.floor((endTime - examState.startTime) / 1000);
        const finalTimeTaken = Math.min(Math.max(timeTakenSeconds, 0), examState.timeLimit + 60);

        const response = await api.submitExam(examState.examId, examState.answers, finalTimeTaken);

        if (response.success) {
            document.getElementById('examTakingModal').classList.remove('active');

            const submissionId = response.data.submission_id;

            if (submissionId) {
                await viewExamResult(submissionId);
            } else {
                alert('시험이 제출되었습니다.');
            }

            // Reload dashboard if available
            if (window.loadStudentDashboard) window.loadStudentDashboard();
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('답안 제출 중 오류가 발생했습니다: ' + error.message);
    }
}

export async function viewExamResult(submissionId) {
    try {
        const response = await api.getExamSubmission(submissionId);
        if (!response.success) throw new Error(response.message);

        const { exam, submission, questions } = response.data;

        document.getElementById('resultExamTitle').textContent = exam.title;
        document.getElementById('resultCourseTitle').textContent = exam.course_name;
        document.getElementById('resultScore').textContent = submission.score;
        document.getElementById('resultTotalScore').textContent = exam.total_score;
        document.getElementById('resultDate').textContent = new Date(submission.submitted_at).toLocaleDateString();

        const minutes = Math.floor(submission.time_taken / 60);
        const seconds = submission.time_taken % 60;
        document.getElementById('resultTimeTaken').textContent = `${minutes}분 ${seconds}초`;

        const questionsList = document.getElementById('resultQuestionsList');
        questionsList.innerHTML = questions.map((q, index) => {
            const isCorrect = q.is_correct;
            const statusColor = isCorrect ? 'var(--success-color)' : 'var(--danger-color)';
            const statusIcon = isCorrect ? '✅ 정답' : '❌ 오답';
            const statusBg = isCorrect ? '#ecfdf5' : '#fef2f2';

            let studentAnswerDisplay = q.student_answer || '(미응답)';
            let correctAnswerDisplay = q.correct_answer;

            if (q.type === 'true_false') {
                studentAnswerDisplay = q.student_answer === '1' ? 'True' : (q.student_answer === '2' ? 'False' : '(미응답)');
                correctAnswerDisplay = q.correct_answer === '1' ? 'True' : 'False';
            }

            return `
                <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); background-color: ${statusBg};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-weight: bold; font-size: 1.125rem;">Q${index + 1}.</span>
                            <span style="color: ${statusColor}; font-weight: bold;">${statusIcon}</span>
                            <span style="font-size: 0.875rem; color: var(--text-secondary); margin-left: 0.5rem;">(배점: ${q.score_weight}점 / 획득: ${q.earned_score}점)</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 500;">${q.question_text}</div>

                    ${renderQuestionOptionsResult(q)}

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.875rem;">
                        <div style="padding: 0.75rem; background: var(--surface-color); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                            <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">내 답안</div>
                            <div style="font-weight: bold; color: ${statusColor};">${studentAnswerDisplay}</div>
                        </div>
                        <div style="padding: 0.75rem; background: var(--surface-color); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                            <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">정답</div>
                            <div style="font-weight: bold; color: var(--primary-color);">${correctAnswerDisplay}</div>
                        </div>
                    </div>

                    ${q.explanation ? `
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: var(--radius-md); font-size: 0.875rem;">
                            <div style="font-weight: bold; color: var(--text-primary); margin-bottom: 0.25rem;">💡 해설</div>
                            <div style="color: var(--text-secondary);">${q.explanation}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        document.getElementById('examResultModal').classList.remove('hidden');
        document.getElementById('examResultModal').classList.add('active');

    } catch (error) {
        console.error('Failed to load exam result:', error);
        alert('시험 결과를 불러오는데 실패했습니다: ' + error.message);
    }
}

function renderQuestionOptionsResult(q) {
    if (q.type === 'multiple_choice') {
        return `
            <div style="margin-left: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                ${q.options.map((opt, i) => {
            const optionNum = i + 1;
            let optionStyle = 'color: var(--text-primary);';
            let icon = '';

            if (String(optionNum) === String(q.correct_answer)) {
                optionStyle = 'color: var(--primary-color); font-weight: bold;';
                icon = '✅';
            } else if (String(optionNum) === String(q.student_answer) && String(q.student_answer) !== String(q.correct_answer)) {
                optionStyle = 'color: var(--danger-color); font-weight: bold;';
                icon = '❌';
            }

            return `<div style="${optionStyle}">${optionNum}. ${opt} ${icon}</div>`;
        }).join('')}
            </div>
        `;
    }
    return '';
}

export function initExamTakingModule() {
    // Window functions for inline events
    window.startExamFlow = startExamFlow;
    window.viewExamResult = viewExamResult;

    window.markAnswer = (questionId, answer) => {
        examState.answers[questionId] = answer;
        const omrBtn = document.getElementById(`omr-${questionId}`);
        if (omrBtn) {
            if (answer) {
                omrBtn.classList.remove('btn-outline-secondary');
                omrBtn.classList.add('btn-primary');
            } else {
                omrBtn.classList.remove('btn-primary');
                omrBtn.classList.add('btn-outline-secondary');
            }
        }
    };

    window.scrollToQuestion = (questionId) => {
        const el = document.getElementById(`q-${questionId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.exitExam = () => {
        if (confirm('시험을 종료하시겠습니까? 답안은 저장되지 않습니다.')) {
            clearInterval(examState.timerInterval);
            document.getElementById('examTakingModal').classList.remove('active');
            resetExamState();
        }
    };

    window.closeExamResult = () => {
        document.getElementById('examResultModal').classList.add('hidden');
        document.getElementById('examResultModal').classList.remove('active');
    };

    // Event Listeners
    document.getElementById('submitExamBtn')?.addEventListener('click', () => {
        const answeredCount = Object.keys(examState.answers).length;
        const totalCount = examState.questions.length;

        if (answeredCount < totalCount) {
            if (!confirm(`${totalCount - answeredCount}개의 문제를 풀지 않았습니다. 그래도 제출하시겠습니까?`)) {
                return;
            }
        } else {
            if (!confirm('정말 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
                return;
            }
        }
        submitExamFlow();
    });

    document.getElementById('exitExamBtn')?.addEventListener('click', window.exitExam);
}
