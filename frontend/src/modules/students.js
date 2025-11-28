import api from '../services/api.js';
import { state } from '../utils/state.js';
import { getStatusText } from '../utils/helpers.js';

export async function loadStudents() {
    try {
        const response = await api.getStudents();
        console.log('Students response:', response); // Debug log

        if (!response || !Array.isArray(response.data)) {
            throw new Error('Invalid response format: data is not an array');
        }

        state.students = response.data;

        const tableContainer = document.getElementById('studentList');

        if (state.students.length > 0) {
            tableContainer.innerHTML = state.students.map(student => `
              <tr>
                <td>${student.name}</td>
                <td>${student.birth_date ? new Date(student.birth_date).toLocaleDateString('ko-KR') : '-'}</td>
                <td>${student.phone || '-'}</td>
                <td>${student.enrollments && student.enrollments.length > 0 && student.enrollments[0].course ? student.enrollments[0].course.title : '-'}</td>
                <td><span class="badge badge-${student.status}">${getStatusText(student.status)}</span></td>
                <td>${student.created_at ? new Date(student.created_at).toLocaleDateString('ko-KR') : '-'}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="window.viewStudent('${student.id}')">상세</button>
                </td>
              </tr>
            `).join('');
        } else {
            tableContainer.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 훈련생이 없습니다.</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load students:', error);
        const tableContainer = document.getElementById('studentList');
        if (tableContainer) tableContainer.innerHTML = `<tr><td colspan="7" class="error-message">학생 목록을 불러오는데 실패했습니다: ${error.message}</td></tr>`;
    }
}

export function initStudentModule() {
    const addStudentBtn = document.getElementById('addStudentBtn');
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');

    addStudentBtn?.addEventListener('click', () => {
        studentModal.classList.add('active');
        studentForm.reset();
        document.getElementById('studentId').value = '';
        document.getElementById('studentModalTitle').textContent = '훈련생 등록';
    });

    studentForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const studentData = Object.fromEntries(formData.entries());
        const studentId = document.getElementById('studentId').value; // Get ID explicitly

        // Remove empty ID if creating
        if (!studentId) {
            delete studentData.id;
        }

        try {
            if (studentId) {
                await api.updateStudent(studentId, studentData);
                alert('학생 정보가 수정되었습니다.');
            } else {
                await api.createStudent(studentData);
                alert('학생이 등록되었습니다.');
            }

            studentModal.classList.remove('active');
            await loadStudents();
        } catch (error) {
            alert(error.message || '학생 정보 저장에 실패했습니다.');
        }
    });

    // Window functions
    window.viewStudent = async (id) => {
        const studentModal = document.getElementById('studentDetailModal');
        const content = document.getElementById('studentDetailContent');
        const editBtn = document.getElementById('editStudentBtn');

        studentModal.classList.add('active');
        content.innerHTML = '<p class="loading">데이터를 불러오는 중...</p>';
        editBtn.style.display = 'none';

        try {
            let student = state.students.find(s => s.id === id);
            if (!student) {
                const response = await api.getStudents();
                student = response.data.find(s => s.id === id);
            }

            if (!student) throw new Error('훈련생 정보를 찾을 수 없습니다.');

            content.innerHTML = `
                <div class="detail-grid">
                <div class="detail-item">
                    <label>이름</label>
                    <div>${student.name}</div>
                </div>
                <div class="detail-item">
                    <label>훈련생 번호</label>
                    <div>${student.trainee_number}</div>
                </div>
                <div class="detail-item">
                    <label>유형</label>
                    <div>${student.trainee_type === 'employed' ? '재직자' : '구직자'}</div>
                </div>
                <div class="detail-item">
                    <label>전화번호</label>
                    <div>${student.phone || '-'}</div>
                </div>
                <div class="detail-item">
                    <label>이메일</label>
                    <div>${student.email || '-'}</div>
                </div>
                <div class="detail-item">
                    <label>과정명</label>
                    <div>${student.course_name || '-'}</div>
                </div>
                <div class="detail-item">
                    <label>상태</label>
                    <div>${getStatusText(student.status)}</div>
                </div>
                <div class="detail-item">
                    <label>등록일</label>
                    <div>${new Date(student.created_at).toLocaleDateString()}</div>
                </div>
            </div>
                `;

            editBtn.style.display = 'block';
            editBtn.onclick = () => window.editStudent(id);

        } catch (error) {
            content.innerHTML = `<p class="error-message"> ${error.message}</p> `;
        }
    };

    window.editStudent = (id) => {
        const student = state.students.find(s => s.id === id);
        if (!student) return;

        document.getElementById('studentDetailModal').classList.remove('active');
        const modal = document.getElementById('studentModal');
        const form = document.getElementById('studentForm');

        modal.classList.add('active');
        document.getElementById('studentModalTitle').textContent = '훈련생 정보 수정';

        form.reset();
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentNumber').value = student.trainee_number;
        document.getElementById('studentBirthDate').value = student.birth_date ? student.birth_date.split('T')[0] : '';
        document.getElementById('studentTraineeType').value = student.trainee_type;
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentCourse').value = student.course_name || '';
        document.getElementById('studentStatus').value = student.status;
    };
}
