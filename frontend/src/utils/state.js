// Global State Management
export const state = {
    user: null,
    students: [],
    consultations: [],
    exams: [],
    parsedQuestions: [], // For PDF upload
    selectedFile: null,  // For PDF upload
    currentPage: 'dashboard'
};

// Exam Taking State
export let examState = {
    examId: null,
    questions: [],
    answers: {},
    startTime: null,
    timerInterval: null,
    timeLimit: 0
};

export function setExamState(newState) {
    examState = { ...examState, ...newState };
}

export function resetExamState() {
    examState = {
        examId: null,
        questions: [],
        answers: {},
        startTime: null,
        timerInterval: null,
        timeLimit: 0
    };
}
