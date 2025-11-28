import config from '../config.js';

class ApiService {
  constructor() {
    this.baseUrl = config.API_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}, isFormData = false) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.token ? `Bearer ${this.token}` : '',
      ...options.headers,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      let data;
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const text = await response.text();
        let errorData = text;
        try {
          errorData = JSON.parse(text);
        } catch (e) { /* ignore */ }
        const errorMessage = (typeof errorData === 'object' && errorData.message) ? errorData.message : (typeof errorData === 'string' ? errorData : 'API 요청 실패');
        throw new Error(errorMessage);
      }

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      return data;

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Helper for authenticated requests
  async fetchWithAuth(endpoint, options = {}) {
    return this.request(endpoint, options);
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Student endpoints
  async getStudents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/students?${queryString}`);
  }

  async getStudent(id) {
    return this.request(`/students/${id}`);
  }

  async createStudent(studentData) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id, studentData) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  async getStudentStats() {
    return this.request('/students/stats/overview');
  }

  // Consultation endpoints
  async getConsultations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/consultations?${queryString}`);
  }

  async getConsultation(id) {
    return this.request(`/consultations/${id}`);
  }

  async createConsultation(consultationData) {
    return this.request('/consultations', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  async updateConsultation(id, consultationData) {
    return this.request(`/consultations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(consultationData),
    });
  }

  async deleteConsultation(id) {
    return this.request(`/consultations/${id}`, {
      method: 'DELETE',
    });
  }

  async getTodayConsultations() {
    return this.request('/consultations/today');
  }

  async getUpcomingFollowUps() {
    return this.request('/consultations/upcoming/follow-ups');
  }

  async getConsultationStats() {
    return this.request('/consultations/stats/overview');
  }

  async analyzeConsultation(content) {
    return this.request('/consultations/analyze', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Exam Question endpoints (문제은행)
  async getExamQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/exam-questions?${queryString}`);
  }

  async getExamQuestion(id) {
    return this.request(`/exam-questions/${id}`);
  }

  async createExamQuestion(questionData) {
    return this.request('/exam-questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async updateExamQuestion(id, questionData) {
    return this.request(`/exam-questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  }

  async deleteExamQuestion(id) {
    return this.request(`/exam-questions/${id}`, {
      method: 'DELETE',
    });
  }

  async getQuestionStats() {
    return this.request('/exam-questions/stats/overview');
  }

  // Exam endpoints (시험 관리)
  async getExams(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/exams?${queryString}`);
  }

  async getExam(id) {
    return this.request(`/exams/${id}`);
  }

  async createExam(examData) {
    return this.request('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  }

  async updateExam(id, examData) {
    return this.request(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(examData),
    });
  }

  async deleteExam(id) {
    return this.request(`/exams/${id}`, {
      method: 'DELETE',
    });
  }

  // PDF upload endpoints
  async uploadPDFQuestions(file) {
    const formData = new FormData();
    formData.append('pdf', file);

    return this.request('/exam-questions/upload-pdf', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    }, true); // Skip JSON Content-Type
  }

  async batchCreateQuestions(questions) {
    return this.request('/exam-questions/batch', {
      method: 'POST',
      body: JSON.stringify({ questions })
    });
  }

  // Exam Submissions (Student)
  async getAvailableExams() {
    return this.request('/exam-submissions/available');
  }

  async startExam(examId) {
    return this.request(`/exam-submissions/${examId}/start`, {
      method: 'POST'
    });
  }

  async submitExam(examId, answers, timeTaken) {
    return this.request(`/exam-submissions/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, time_taken: timeTaken })
    });
  }

  async getExamSubmission(submissionId) {
    return this.request(`/exam-submissions/${submissionId}`);
  }
}

export default new ApiService();
