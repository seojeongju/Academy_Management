import api from '../services/api.js';
import { state } from '../utils/state.js';
import { getDifficultyText, getQuestionTypeText } from '../utils/helpers.js';
import { loadExamQuestions } from './exams.js';

export function initPDFUploadModule() {
    const pdfUploadModal = document.getElementById('pdfUploadModal');
    const uploadPDFBtn = document.getElementById('uploadPDFBtn');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const uploadPDFFileBtn = document.getElementById('uploadPDFFileBtn');
    const cancelPDFUploadBtn = document.getElementById('cancelPDFUploadBtn');
    const batchRegisterQuestionsBtn = document.getElementById('batchRegisterQuestionsBtn');

    // Open PDF upload modal
    uploadPDFBtn?.addEventListener('click', () => {
        pdfUploadModal.classList.add('active');
        resetPDFUploadModal();
    });

    // File input change
    pdfFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            state.selectedFile = file;
            uploadPDFFileBtn.disabled = false;

            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기는 10MB를 초과할 수 없습니다.');
                pdfFileInput.value = '';
                state.selectedFile = null;
                uploadPDFFileBtn.disabled = true;
            }
        } else {
            state.selectedFile = null;
            uploadPDFFileBtn.disabled = true;
        }
    });

    // Upload and parse PDF
    uploadPDFFileBtn?.addEventListener('click', async () => {
        if (!state.selectedFile) {
            alert('PDF 파일을 선택해주세요.');
            return;
        }

        try {
            showPDFStep('parsing');
            const response = await api.uploadPDFQuestions(state.selectedFile);

            if (response.success) {
                state.parsedQuestions = response.data.questions;
                displayParsedQuestions();
                showPDFStep('review');
            } else {
                throw new Error(response.message || 'PDF 파싱에 실패했습니다.');
            }

        } catch (error) {
            console.error('PDF upload error:', error);
            alert(error.message || 'PDF 업로드 및 파싱 중 오류가 발생했습니다.');
            resetPDFUploadModal();
        }
    });

    // Batch register questions
    batchRegisterQuestionsBtn?.addEventListener('click', async () => {
        if (state.parsedQuestions.length === 0) {
            alert('등록할 문제가 없습니다.');
            return;
        }

        if (!confirm(`${state.parsedQuestions.length}개의 문제를 일괄 등록하시겠습니까?`)) {
            return;
        }

        try {
            const response = await api.batchCreateQuestions(state.parsedQuestions);

            if (response.success) {
                alert(response.message || '문제가 일괄 등록되었습니다.');
                pdfUploadModal.classList.remove('active');
                await loadExamQuestions(); // Reload question list
            } else {
                throw new Error(response.message || '문제 등록에 실패했습니다.');
            }

        } catch (error) {
            console.error('Batch register error:', error);
            alert(error.message || '문제 등록 중 오류가 발생했습니다.');
        }
    });

    // Cancel PDF upload
    cancelPDFUploadBtn?.addEventListener('click', () => {
        if (confirm('파싱된 문제를 취소하시겠습니까?')) {
            pdfUploadModal.classList.remove('active');
            resetPDFUploadModal();
        }
    });

    // Close PDF upload modal on ESC or background click
    pdfUploadModal?.addEventListener('click', (e) => {
        if (e.target === pdfUploadModal) {
            if (state.parsedQuestions.length > 0) {
                if (confirm('파싱된 문제를 취소하시겠습니까?')) {
                    pdfUploadModal.classList.remove('active');
                    resetPDFUploadModal();
                }
            } else {
                pdfUploadModal.classList.remove('active');
                resetPDFUploadModal();
            }
        }
    });

    // Window functions for inline editing
    window.editParsedQuestion = (index) => {
        const question = state.parsedQuestions[index];
        if (!question) return;

        const newText = prompt('문제 내용 수정:', question.question_text);
        if (newText && newText.trim()) {
            state.parsedQuestions[index].question_text = newText.trim();
            displayParsedQuestions();
        }
    };

    window.removeParsedQuestion = (index) => {
        if (confirm('이 문제를 제거하시겠습니까?')) {
            state.parsedQuestions.splice(index, 1);
            displayParsedQuestions();
        }
    };
}

function displayParsedQuestions() {
    const container = document.getElementById('parsedQuestionsContainer');
    const countElement = document.getElementById('parsedQuestionCount');
    const registerCountElement = document.getElementById('registerCount');

    countElement.textContent = state.parsedQuestions.length;
    registerCountElement.textContent = state.parsedQuestions.length;

    if (state.parsedQuestions.length === 0) {
        container.innerHTML = '<p class="empty-state">파싱된 문제가 없습니다.</p>';
        return;
    }

    container.innerHTML = state.parsedQuestions.map((q, index) => `
        <div class="parsed-question-card" data-index="${index}">
            <h4>문제 ${index + 1}</h4>
            <div class="question-meta">
                <span class="badge badge-${q.difficulty}">${getDifficultyText(q.difficulty)}</span>
                <span class="badge">${getQuestionTypeText(q.type)}</span>
                <span>${q.score_weight}점</span>
            </div>
            <div class="question-text">
                <strong>문제:</strong> ${q.question_text}
            </div>
            ${q.options && q.options.length > 0 ? `
                <div class="question-options">
                    <strong>선택지:</strong>
                    <ol>
                        ${q.options.map(opt => `<li>${opt}</li>`).join('')}
                    </ol>
                </div>
            ` : ''}
            <div class="question-answer">
                <strong>정답:</strong> ${q.correct_answer}
            </div>
            ${q.explanation ? `
                <div style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                    <strong>해설:</strong> ${q.explanation}
                </div>
            ` : ''}
            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="window.editParsedQuestion(${index})">
                    ✏️ 수정
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="window.removeParsedQuestion(${index})">
                    🗑️ 제거
                </button>
            </div>
        </div>
    `).join('');
}

function showPDFStep(step) {
    const steps = {
        upload: document.getElementById('pdfUploadStep'),
        parsing: document.getElementById('pdfParsingStep'),
        review: document.getElementById('pdfReviewStep')
    };

    Object.values(steps).forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (steps[step]) {
        steps[step].style.display = 'block';
    }
}

function resetPDFUploadModal() {
    state.parsedQuestions = [];
    state.selectedFile = null;
    const pdfFileInput = document.getElementById('pdfFileInput');
    const uploadPDFFileBtn = document.getElementById('uploadPDFFileBtn');

    if (pdfFileInput) pdfFileInput.value = '';
    if (uploadPDFFileBtn) uploadPDFFileBtn.disabled = true;

    showPDFStep('upload');
}
