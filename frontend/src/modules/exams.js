import api from '../services/api.js';
import { state } from '../utils/state.js';
import { getExamTypeText } from '../utils/helpers.js';

export async function loadExams() {
    try {
        const response = await api.getExams();
        state.exams = response.data;

        const tableContainer = document.getElementById('examsTable');

        if (state.exams.length > 0) {
            tableContainer.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>시험명</th>
              <th>강좌명</th>
              <th>유형</th>
              <th>응시 기간</th>
              <th>제한 시간</th>
              <th>총점</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            ${state.exams.map(exam => `
              <tr>
                <td>${exam.title}</td>
                <td>${exam.course_name}</td>
                <td>${getExamTypeText(exam.exam_type)}</td>
                <td>${new Date(exam.start_time).toLocaleDateString()} ~ ${new Date(exam.end_time).toLocaleDateString()}</td>
                <td>${exam.time_limit ? exam.time_limit + '분' : '-'}</td>
                <td>${exam.total_score}점</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="window.viewExam('${exam.id}')">상세</button>
                  <button class="btn btn-sm btn-secondary" onclick="window.viewSubmissions('${exam.id}')">응시자</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
        } else {
            tableContainer.innerHTML = '<p class="empty-state">등록된 시험이 없습니다.</p>';
        }
    } catch (error) {
        console.error('Failed to load exams:', error);
        document.getElementById('examsTable').innerHTML = '<p class="error-message">시험 목록을 불러오는데 실패했습니다.</p>';
    }
}

export async function loadExamQuestions() {
    const container = document.getElementById('questionBankList');
    if (container) container.innerHTML = '<p class="loading">문제은행을 불러오는 중...</p>';

    try {
        // Placeholder for question bank loading
        // const response = await api.getQuestions();
        if (container) container.innerHTML = '<p class="empty-state">문제은행 기능 준비 중...</p>';
    } catch (error) {
        if (container) container.innerHTML = '<p class="error-message">문제 목록을 불러오는데 실패했습니다.</p>';
    }
}

export function initExamModule() {
    const addExamBtn = document.getElementById('addExamBtn');
    const examModal = document.getElementById('examModal');
    const examForm = document.getElementById('examForm');

    addExamBtn?.addEventListener('click', () => {
        examModal.classList.add('active');
        examForm.reset();
        document.getElementById('examModalTitle').textContent = '시험 출제';
    });

    examForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('시험 생성 기능은 아직 구현되지 않았습니다.');
    });

    // Window functions
    window.viewExam = async (id) => {
        const modal = document.getElementById('examDetailModal');
        const content = document.getElementById('examDetailContent');
        const deleteBtn = document.getElementById('deleteExamBtn');

        modal.classList.add('active');
        content.innerHTML = '<p class="loading">데이터를 불러오는 중...</p>';
        deleteBtn.style.display = 'none';

        try {
            let exam = state.exams.find(e => e.id === id);
            if (!exam) {
                const response = await api.getExams();
                exam = response.data.find(e => e.id === id);
            }

            if (!exam) throw new Error('시험 정보를 찾을 수 없습니다.');

            content.innerHTML = `
                <div class="detail-group">
                <h3>${exam.title}</h3>
                <p class="text-secondary">${getExamTypeText(exam.exam_type)}</p>
                <div style="margin: 1rem 0; padding: 1rem; background: var(--bg-color); border-radius: var(--radius-md);">
                    ${exam.description || '설명 없음'}
                </div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>응시 기간</label>
                        <div>${new Date(exam.start_time).toLocaleString()} ~ ${new Date(exam.end_time).toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <label>제한 시간</label>
                        <div>${exam.time_limit ? exam.time_limit + '분' : '제한없음'}</div>
                    </div>
                    <div class="detail-item">
                        <label>총점</label>
                        <div>${exam.total_score}점</div>
                    </div>
                </div>
            </div>
                `;

            deleteBtn.style.display = 'block';
            deleteBtn.onclick = async () => {
                if (confirm('정말 이 시험을 삭제하시겠습니까?')) {
                    try {
                        await api.deleteExam(id);
                        alert('시험이 삭제되었습니다.');
                        modal.classList.remove('active');
                        loadExams();
                    } catch (e) {
                        alert('삭제 실패: ' + e.message);
                    }
                }
            };

        } catch (error) {
            content.innerHTML = `<p class="error-message"> ${error.message}</p> `;
        }
    };

    window.viewSubmissions = async (id) => {
        alert(`응시자 목록 기능은 곧 추가될 예정입니다. (ID: ${id})`);
    };
}
