import api from '../services/api.js';
import { state } from '../utils/state.js';
import { getCategoryText } from '../utils/helpers.js';

export async function loadDashboard() {
    try {
        // Load statistics
        const [studentStats, consultStats, todayConsults, upcomingFollowUps] = await Promise.all([
            api.getStudentStats(),
            api.getConsultationStats(),
            api.getTodayConsultations(),
            api.getUpcomingFollowUps()
        ]);

        // Update stats
        document.getElementById('totalStudents').textContent = studentStats.data.total;
        document.getElementById('newStudents').textContent = studentStats.data.newThisMonth;
        document.getElementById('consultationCount').textContent = consultStats.data.thisMonth;
        document.getElementById('todayConsultations').textContent = todayConsults.data.length;

        // Update today's tasks
        const todayTasksContainer = document.getElementById('todayTasks');
        if (todayConsults.data.length > 0) {
            todayTasksContainer.innerHTML = todayConsults.data.map(consult => `
        <div class="task-item">
          <h4>${consult.student.name} - ${getCategoryText(consult.category)}</h4>
          <p>${new Date(consult.next_follow_up_date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      `).join('');
        } else {
            todayTasksContainer.innerHTML = '<p class="empty-state">오늘 예정된 일정이 없습니다.</p>';
        }

        // Update upcoming follow-ups
        const followUpsContainer = document.getElementById('upcomingFollowUps');
        if (upcomingFollowUps.data.length > 0) {
            followUpsContainer.innerHTML = upcomingFollowUps.data.map(consult => `
        <div class="followup-item">
          <h4>${consult.student.name}</h4>
          <p>${new Date(consult.next_follow_up_date).toLocaleDateString('ko-KR')} - ${getCategoryText(consult.category)}</p>
        </div>
      `).join('');
        } else {
            followUpsContainer.innerHTML = '<p class="empty-state">예정된 재상담이 없습니다.</p>';
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

export async function loadStudentDashboard() {
    const dashboardContent = document.getElementById('studentDashboardContent');
    dashboardContent.innerHTML = `
        <div class="dashboard-card">
            <h3>환영합니다!</h3>
            <p>나의 학습 현황을 확인할 수 있습니다.</p>
        </div>
    `;
}
