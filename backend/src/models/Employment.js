import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Employment = sequelize.define('Employment', {
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
        references: {
            model: 'users',
            key: 'id',
        },
        comment: '직업상담사 ID',
    },
    // 취업 정보
    company_name: {
        type: DataTypes.STRING(200),
        comment: '회사명',
    },
    position: {
        type: DataTypes.STRING(100),
        comment: '직위/직책',
    },
    employment_type: {
        type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern', 'self_employed'),
        comment: '고용 형태',
    },
    salary: {
        type: DataTypes.DECIMAL(12, 2),
        comment: '연봉/급여',
    },
    start_date: {
        type: DataTypes.DATEONLY,
        comment: '입사일',
    },
    // 알선 정보
    referral_type: {
        type: DataTypes.ENUM('self', 'center_referral', 'instructor_referral', 'job_fair'),
        comment: '취업 경로',
    },
    referral_date: {
        type: DataTypes.DATEONLY,
        comment: '알선일',
    },
    // 서류 제출
    resume_submitted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '이력서 제출 여부',
    },
    resume_feedback: {
        type: DataTypes.TEXT,
        comment: '이력서 첨삭 내용',
    },
    // 인증
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '취업 확인 여부',
    },
    verification_document: {
        type: DataTypes.STRING(500),
        comment: '재직증명서 등 증빙 문서',
    },
    verification_date: {
        type: DataTypes.DATEONLY,
        comment: '취업 확인일',
    },
    notes: {
        type: DataTypes.TEXT,
        comment: '특이사항',
    },
}, {
    tableName: 'employments',
    indexes: [
        { fields: ['trainee_id'] },
        { fields: ['counselor_id'] },
        { fields: ['start_date'] },
    ],
});

export default Employment;
