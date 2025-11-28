// Helper Functions

export function getRoleText(role) {
    const roleMap = {
        'admin': '원장',
        'manager': '실장',
        'teacher': '강사',
        'student': '훈련생'
    };
    return roleMap[role] || role;
}

export function getStatusText(status) {
    const statusMap = {
        'active': '재원',
        'inactive': '휴원',
        'waiting': '대기',
        'graduated': '졸업',
        'withdrawn': '퇴원',
        'completed': '수료',
        'dropped': '중도탈락'
    };
    return statusMap[status] || status;
}

export function getCategoryText(category) {
    const categoryMap = {
        'admission_interview': '입학 면접',
        'selection_eval': '선발 평가',
        'attendance_issue': '출결 문제',
        'learning_difficulty': '학습 고충',
        'grade_consultation': '성적 상담',
        'complaint': '불만 접수',
        'dropout_prevention': '중도탈락 방어',
        'career_counseling': '진로 상담',
        'job_placement': '취업 알선',
        'follow_up': '사후 관리',
        'other': '기타'
    };
    return categoryMap[category] || category;
}

export function getExamTypeText(type) {
    const typeMap = {
        'daily': '일일 테스트',
        'weekly': '주간 테스트',
        'monthly': '월말 평가'
    };
    return typeMap[type] || type;
}

export function getDifficultyText(difficulty) {
    const diffMap = {
        'easy': '쉬움',
        'medium': '보통',
        'hard': '어려움'
    };
    return diffMap[difficulty] || difficulty;
}

export function getQuestionTypeText(type) {
    const typeMap = {
        'multiple_choice': '객관식',
        'multiple_answer': '복수선택',
        'short_answer': '단답형',
        'essay': '서술형',
        'true_false': 'OX'
    };
    return typeMap[type] || type;
}

export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
