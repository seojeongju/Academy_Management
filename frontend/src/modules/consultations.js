import api from '../services/api.js';
import { state } from '../utils/state.js';
import { getCategoryText, getStatusText, debounce } from '../utils/helpers.js';
import { loadDashboard } from './dashboard.js';

export async function loadConsultations(page = 1) {
    const tableContainer = document.getElementById('consultationsTable');
    tableContainer.innerHTML = '<p class="loading">데이터를 불러오는 중...</p>';

    try {
        const category = document.getElementById('consultationCategoryFilter')?.value || '';
        const search = document.getElementById('consultationSearch')?.value || '';
        const startDate = document.getElementById('consultationStartDate')?.value || '';
        const endDate = document.getElementById('consultationEndDate')?.value || '';

        const response = await api.getConsultations({
            page,
            limit: 10,
            category,
            search,
            startDate,
            endDate
        });

        const { data, pagination } = response;
        state.consultations = data;

        if (state.consultations.length > 0) {
            let html = `
                <table>
          <thead>
            <tr>
              <th>학생</th>
              <th>유형</th>
              <th>상담일</th>
              <th>상담 내용</th>
              <th>중요도</th>
              <th>다음 상담일</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            ${state.consultations.map(consult => `
              <tr>
                <td>${consult.student?.name || '-'}</td>
                <td>${getCategoryText(consult.category)}</td>
                <td>${new Date(consult.consult_date).toLocaleDateString('ko-KR')}</td>
                <td>${consult.content.substring(0, 30)}${consult.content.length > 30 ? '...' : ''}</td>
                <td>${'⭐'.repeat(consult.importance)}</td>
                <td>${consult.next_follow_up_date ? new Date(consult.next_follow_up_date).toLocaleDateString('ko-KR') : '-'}</td>
                <td><span class="status-badge status-${consult.status}">${getStatusText(consult.status)}</span></td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="window.viewConsultation('${consult.id}')">상세</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
                `;

            // Pagination
            if (pagination && pagination.totalPages > 1) {
                html += `<div class="pagination">
                    <button ${pagination.page === 1 ? 'disabled' : ''} onclick="window.loadConsultations(${pagination.page - 1})">이전</button>
                    <span>${pagination.page} / ${pagination.totalPages}</span>
                    <button ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="window.loadConsultations(${pagination.page + 1})">다음</button>
                 </div>`;
            }

            tableContainer.innerHTML = html;
        } else {
            tableContainer.innerHTML = '<p class="empty-state">등록된 상담 기록이 없습니다.</p>';
        }
    } catch (error) {
        console.error('Failed to load consultations:', error);
        tableContainer.innerHTML = '<p class="error-message">상담 목록을 불러오는데 실패했습니다.</p>';
    }
}

export function initConsultationModule() {
    const addConsultationBtn = document.getElementById('addConsultationBtn');
    const consultationModal = document.getElementById('consultationModal');
    const consultationForm = document.getElementById('consultationForm');

    // Filter Event Listeners
    document.getElementById('consultationSearch')?.addEventListener('input', debounce(() => loadConsultations(1), 500));
    document.getElementById('consultationDateFilter')?.addEventListener('change', () => loadConsultations(1));
    document.getElementById('consultationTypeFilter')?.addEventListener('change', () => loadConsultations(1)); // Changed ID to match HTML

    // Add Consultation Button
    addConsultationBtn?.addEventListener('click', async () => {
        consultationModal.classList.add('active');
        consultationForm.reset();
        document.getElementById('consultationId').value = ''; // Reset ID
        document.getElementById('consultationModalTitle').textContent = '상담 등록';

        // Load students for dropdown
        try {
            const response = await api.getStudents();
            const studentSelect = document.getElementById('consultationStudent'); // Correct ID
            studentSelect.innerHTML = '<option value="">학생을 선택하세요</option>' +
                response.data.map(s => `<option value="${s.id}"> ${s.name} (${s.trainee_number})</option> `).join('');
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    });

    // Consultation Form Submission
    consultationForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const consultationData = Object.fromEntries(formData.entries());

        // Convert importance to number
        if (consultationData.importance) {
            consultationData.importance = parseInt(consultationData.importance);
        }

        try {
            if (consultationData.id) { // Update if ID exists (not implemented in HTML yet but good practice)
                // await api.updateConsultation(consultationData.id, consultationData);
            } else {
                await api.createConsultation(consultationData);
            }

            consultationModal.classList.remove('active');
            alert('상담 기록이 등록되었습니다.');
            await loadConsultations();
            await loadDashboard(); // Update dashboard stats
        } catch (error) {
            alert(error.message || '상담 기록 등록에 실패했습니다.');
        }
    });

    // AI Analysis Button
    document.getElementById('analyzeConsultationBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const contentInput = document.getElementById('consultationContent'); // Correct ID
        const content = contentInput.value;

        if (!content || content.length < 10) {
            alert('분석할 내용을 10자 이상 입력해주세요.');
            return;
        }

        const btn = document.getElementById('analyzeConsultationBtn');
        const originalText = btn.textContent;
        btn.textContent = '분석 중...';
        btn.disabled = true;

        try {
            const response = await api.analyzeConsultation(content);
            const result = response.data;

            const analysisText = `
            [AI 분석 결과]
            - 요약: ${result.summary}
            - 감정: ${result.sentiment}
            - 키워드: ${result.keywords?.join(', ')}
            - 조치사항: ${result.action_items?.join(', ')}
            `.trim();

            if (confirm(`분석 결과가 나왔습니다.\n\n${analysisText} \n\n상담 내용에 추가하시겠습니까?`)) {
                contentInput.value += '\n\n' + analysisText;
            }
        } catch (error) {
            alert('AI 분석에 실패했습니다: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// Window functions
window.loadConsultations = loadConsultations;

window.viewConsultation = async (id) => {
    const modal = document.getElementById('consultationDetailModal');
    const content = document.getElementById('consultationDetailContent');
    const editBtn = document.getElementById('editConsultationBtn');

    modal.classList.add('active');
    content.innerHTML = '<p class="loading">데이터를 불러오는 중...</p>';
    editBtn.style.display = 'none';

    try {
        let consultation = state.consultations.find(c => c.id === id);

        if (!consultation) {
            const response = await api.getConsultation(id);
            consultation = response.data;
        }

        if (!consultation) throw new Error('상담 정보를 찾을 수 없습니다.');

        content.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>학생 이름</label>
                    <div>${consultation.student ? consultation.student.name : '알 수 없음'}</div>
                </div>
                <div class="detail-item">
                    <label>상담 유형</label>
                    <div>${getCategoryText(consultation.category)}</div>
                </div>
                <div class="detail-item">
                    <label>상담 일자</label>
                    <div>${new Date(consultation.consult_date).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                    <label>중요도</label>
                    <div>${'⭐'.repeat(consultation.importance)}</div>
                </div>
                <div class="detail-item">
                    <label>상태</label>
                    <div>${getStatusText(consultation.status)}</div>
                </div>
                <div class="detail-item">
                    <label>다음 상담</label>
                    <div>${consultation.next_follow_up_date ? new Date(consultation.next_follow_up_date).toLocaleDateString() : '-'}</div>
                </div>
            </div>
            <div class="detail-group">
                <label>상담 내용</label>
                <div style="white-space: pre-wrap; background: var(--bg-color); padding: 1rem; border-radius: var(--radius-md); margin-top: 0.5rem;">${consultation.content}</div>
            </div>
        `;

        // Edit button logic could be added here

    } catch (error) {
        content.innerHTML = `<p class="error-message"> ${error.message}</p> `;
    }
};
