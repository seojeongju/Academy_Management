import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Consultation = sequelize.define('Consultation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
    counselor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    consult_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    // 상담 단계
    consultation_phase: {
        type: DataTypes.ENUM('pre_admission', 'during_training', 'post_training', 'employment'),
        allowNull: false,
        comment: '입학 전 선발/훈련 중/수료 후/취업 상담',
    },
    contact_person: {
        type: DataTypes.ENUM('trainee', 'family', 'company', 'other'),
        defaultValue: 'trainee',
        comment: '상담 대상',
    },
    contact_method: {
        type: DataTypes.ENUM('phone', 'visit', 'kakao', 'sms', 'video', 'other'),
        defaultValue: 'phone',
        comment: '상담 방법',
    },
    category: {
        type: DataTypes.ENUM(
            'admission_interview',    // 입학 면접
            'selection_eval',         // 선발 평가
            'attendance_issue',       // 출결 문제
            'learning_difficulty',    // 학습 고충
            'grade_consultation',     // 성적 상담
            'complaint',              // 불만 접수
            'dropout_prevention',     // 중도탈락 방어
            'career_counseling',      // 진로 상담
            'job_placement',          // 취업 알선
            'follow_up',              // 사후 관리
            'other'
        ),
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '상담 내용',
    },
    // 선발 평가 관련 (입학 전)
    evaluation_score: {
        type: DataTypes.INTEGER,
        comment: '선발 평가 점수',
    },
    evaluation_result: {
        type: DataTypes.ENUM('pass', 'fail', 'pending'),
        comment: '선발 결과',
    },
    // 취업 상담 관련
    job_title: {
        type: DataTypes.STRING(100),
        comment: '희망 직무',
    },
    target_company: {
        type: DataTypes.STRING(200),
        comment: '타겟 기업',
    },
    resume_review: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '이력서 검토 여부',
    },
    // 일반
    importance: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 5,
        },
        comment: '중요도 (1-5)',
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'scheduled', 'cancelled'),
        defaultValue: 'completed',
    },
    next_follow_up_date: {
        type: DataTypes.DATE,
        comment: '다음 상담 예정일',
    },
    follow_up_reminder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '리마인더 설정 여부',
    },
    attachments: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        comment: '첨부 파일 목록 (JSON)',
        get() {
            const rawValue = this.getDataValue('attachments');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('attachments', JSON.stringify(value || []));
        }
    },
}, {
    tableName: 'consultations',
    indexes: [
        { fields: ['trainee_id'] },
        { fields: ['counselor_id'] },
        { fields: ['consult_date'] },
        { fields: ['consultation_phase'] },
        { fields: ['category'] },
        { fields: ['status'] },
        { fields: ['next_follow_up_date'] },
    ],
});

export default Consultation;
