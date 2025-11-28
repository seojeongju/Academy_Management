import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Exam = sequelize.define('Exam', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id',
        },
    },
    teacher_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '시험 제목 (중간고사, 단원평가 등)',
    },
    description: {
        type: DataTypes.TEXT,
        comment: '시험 설명',
    },
    exam_type: {
        type: DataTypes.ENUM('midterm', 'final', 'quiz', 'assignment', 'practice'),
        defaultValue: 'quiz',
        comment: '시험 유형',
    },
    // 시험 문제 구성
    questions: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '문제 목록 (question_id와 배점 JSON)',
        get() {
            const rawValue = this.getDataValue('questions');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('questions', JSON.stringify(value || []));
        }
    },
    total_score: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: '총점',
    },
    // 시험 시간
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '응시 시작 가능 시간',
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '응시 마감 시간',
    },
    time_limit: {
        type: DataTypes.INTEGER,
        comment: '제한 시간 (분)',
    },
    // 시험 옵션
    shuffle_questions: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '문제 순서 섞기',
    },
    shuffle_options: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '선택지 순서 섞기',
    },
    show_results_immediately: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '결과 즉시 공개',
    },
    allow_review: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '답안 및 해설 확인 허용',
    },
    prevent_browser_exit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '브라우저 이탈 감지',
    },
    // 통계
    total_submissions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '총 응시 인원',
    },
    average_score: {
        type: DataTypes.DECIMAL(5, 2),
        comment: '평균 점수',
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'exams',
    indexes: [
        { fields: ['course_id'] },
        { fields: ['teacher_id'] },
        { fields: ['start_time'] },
        { fields: ['end_time'] },
    ],
});

export default Exam;
