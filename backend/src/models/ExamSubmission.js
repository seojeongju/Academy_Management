import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ExamSubmission = sequelize.define('ExamSubmission', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    exam_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'exams',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    trainee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'trainees',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    // 응시 정보
    started_at: {
        type: DataTypes.DATE,
        comment: '시험 시작 시간',
    },
    submitted_at: {
        type: DataTypes.DATE,
        comment: '제출 시간',
    },
    time_taken: {
        type: DataTypes.INTEGER,
        comment: '소요 시간 (초)',
    },
    // 답안
    submitted_answers: {
        type: DataTypes.TEXT,
        comment: '제출 답안 (JSON)',
        get() {
            const rawValue = this.getDataValue('submitted_answers');
            return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
            this.setDataValue('submitted_answers', JSON.stringify(value || {}));
        }
    },
    // 채점
    score: {
        type: DataTypes.DECIMAL(5, 2),
        comment: '총점',
    },
    percentage: {
        type: DataTypes.DECIMAL(5, 2),
        comment: '백분율 점수',
    },
    grading_status: {
        type: DataTypes.ENUM('pending', 'auto_graded', 'manually_graded', 'completed'),
        defaultValue: 'pending',
        comment: '채점 상태',
    },
    graded_by: {
        type: DataTypes.UUID,
        references: {
            model: 'users',
            key: 'id',
        },
        comment: '채점 교사 ID',
    },
    graded_at: {
        type: DataTypes.DATE,
        comment: '채점 완료 시간',
    },
    // 피드백
    feedback: {
        type: DataTypes.TEXT,
        comment: '강사 총평',
    },
    question_feedback: {
        type: DataTypes.TEXT,
        comment: '문항별 피드백 (JSON)',
        get() {
            const rawValue = this.getDataValue('question_feedback');
            return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
            this.setDataValue('question_feedback', JSON.stringify(value || {}));
        }
    },
    // 부정행위 감지
    browser_exit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '브라우저 이탈 횟수',
    },
    ip_address: {
        type: DataTypes.STRING(45),
        comment: '응시 IP 주소',
    },
    user_agent: {
        type: DataTypes.STRING(500),
        comment: '응시 브라우저 정보',
    },
}, {
    tableName: 'exam_submissions',
    indexes: [
        { fields: ['exam_id'] },
        { fields: ['trainee_id'] },
        { fields: ['grading_status'] },
        { unique: true, fields: ['exam_id', 'trainee_id'] },
    ],
});

export default ExamSubmission;
