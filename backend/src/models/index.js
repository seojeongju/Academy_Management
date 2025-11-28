import sequelize from '../config/database.js';
import User from './User.js';
import Trainee from './Trainee.js';
import Consultation from './Consultation.js';
import Course from './Course.js';
import Enrollment from './Enrollment.js';
import ExamQuestion from './ExamQuestion.js';
import Exam from './Exam.js';
import ExamSubmission from './ExamSubmission.js';
import Employment from './Employment.js';

// Define relationships

// User - Trainee (1:1 - 사용자 계정과 훈련생 정보 연결)
User.hasOne(Trainee, { foreignKey: 'user_id', as: 'trainee_profile' });
Trainee.belongsTo(User, { foreignKey: 'user_id', as: 'user_account' });

// User - Course (1:N - 강사가 여러 강좌를 담당)
User.hasMany(Course, { foreignKey: 'teacher_id', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// User - Consultation (1:N - 상담사가 여러 상담 진행)
User.hasMany(Consultation, { foreignKey: 'counselor_id', as: 'consultations' });
Consultation.belongsTo(User, { foreignKey: 'counselor_id', as: 'counselor' });

// User - ExamQuestion (1:N - 교사가 여러 문제 출제)
User.hasMany(ExamQuestion, { foreignKey: 'teacher_id', as: 'exam_questions' });
ExamQuestion.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// User - Exam (1:N - 교사가 여러 시험 출제)
User.hasMany(Exam, { foreignKey: 'teacher_id', as: 'exams' });
Exam.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Trainee - Consultation (1:N - 훈련생에 대한 여러 상담)
Trainee.hasMany(Consultation, { foreignKey: 'trainee_id', as: 'consultations' });
Consultation.belongsTo(Trainee, { foreignKey: 'trainee_id', as: 'trainee' });

// Trainee - Employment (1:N - 훈련생의 취업 이력)
Trainee.hasMany(Employment, { foreignKey: 'trainee_id', as: 'employments' });
Employment.belongsTo(Trainee, { foreignKey: 'trainee_id', as: 'trainee' });

// Trainee - ExamSubmission (1:N - 훈련생의 시험 응시 이력)
Trainee.hasMany(ExamSubmission, { foreignKey: 'trainee_id', as: 'exam_submissions' });
ExamSubmission.belongsTo(Trainee, { foreignKey: 'trainee_id', as: 'trainee' });

// Trainee - Course (N:M through Enrollment)
Trainee.belongsToMany(Course, {
    through: Enrollment,
    foreignKey: 'student_id',
    as: 'courses'
});
Course.belongsToMany(Trainee, {
    through: Enrollment,
    foreignKey: 'course_id',
    as: 'trainees'
});

// Direct associations for Enrollment
Trainee.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(Trainee, { foreignKey: 'student_id', as: 'trainee' });

Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course - ExamQuestion (1:N - 과정별 문제은행)
Course.hasMany(ExamQuestion, { foreignKey: 'course_id', as: 'exam_questions' });
ExamQuestion.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course - Exam (1:N - 과정별 시험)
Course.hasMany(Exam, { foreignKey: 'course_id', as: 'exams' });
Exam.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Exam - ExamSubmission (1:N - 시험별 응시 이력)
Exam.hasMany(ExamSubmission, { foreignKey: 'exam_id', as: 'submissions' });
ExamSubmission.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

// User - Employment (1:N - 상담사의 취업 알선 이력)
User.hasMany(Employment, { foreignKey: 'counselor_id', as: 'employments' });
Employment.belongsTo(User, { foreignKey: 'counselor_id', as: 'counselor' });

// User - ExamSubmission (채점자)
User.hasMany(ExamSubmission, { foreignKey: 'graded_by', as: 'graded_submissions' });
ExamSubmission.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });

export {
    sequelize,
    User,
    Trainee,
    Consultation,
    Course,
    Enrollment,
    ExamQuestion,
    Exam,
    ExamSubmission,
    Employment,
};

export default {
    sequelize,
    User,
    Trainee,
    Consultation,
    Course,
    Enrollment,
    ExamQuestion,
    Exam,
    ExamSubmission,
    Employment,
};
