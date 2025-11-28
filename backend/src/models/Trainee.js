import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Trainee = sequelize.define('Trainee', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true, // 기존 데이터 호환성을 위해 true, 신규는 필수
        references: {
            model: 'users',
            key: 'id',
        },
        comment: '연동된 사용자 계정 ID',
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    trainee_number: {
        type: DataTypes.STRING(20),
        unique: true,
        comment: '훈련생 번호',
    },
    trainee_type: {
        type: DataTypes.ENUM('employed', 'job_seeker'),
        allowNull: false,
        comment: '재직자/구직자 구분',
    },
    course_type: {
        type: DataTypes.ENUM('refund', 'non_refund', 'national', 'k_digital'),
        comment: '과정 유형 (환급/비환급/국기/K-Digital)',
    },
    phone: {
        type: DataTypes.STRING(20),
    },
    email: {
        type: DataTypes.STRING(100),
    },
    birth_date: {
        type: DataTypes.DATEONLY,
    },
    address: {
        type: DataTypes.TEXT,
    },
    // HRD 관련 정보
    hrd_card_number: {
        type: DataTypes.STRING(50),
        comment: '내일배움카드 번호',
    },
    hrd_card_issued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'HRD-Net 카드 발급 여부',
    },
    self_payment: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '자비 부담금',
    },
    self_payment_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '자비 부담금 납부 여부',
    },
    // 학력 및 경력
    education_level: {
        type: DataTypes.STRING(50),
        comment: '최종 학력',
    },
    work_experience: {
        type: DataTypes.TEXT,
        comment: '경력 사항',
    },
    // 상태
    status: {
        type: DataTypes.ENUM('waiting', 'active', 'completed', 'dropped', 'expelled'),
        defaultValue: 'waiting',
        allowNull: false,
        comment: '대기/재원/수료/자퇴/제적',
    },
    enrollment_date: {
        type: DataTypes.DATEONLY,
        comment: '입학일',
    },
    completion_date: {
        type: DataTypes.DATEONLY,
        comment: '수료일',
    },
    // 취업 관련
    employment_status: {
        type: DataTypes.ENUM('unemployed', 'employed', 'self_employed'),
        defaultValue: 'unemployed',
        comment: '취업 상태',
    },
    employment_date: {
        type: DataTypes.DATEONLY,
        comment: '취업일',
    },
    employment_company: {
        type: DataTypes.STRING(100),
        comment: '취업 회사명',
    },
    // 서류
    documents: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        comment: '제출 서류 목록 (JSON)',
        get() {
            const rawValue = this.getDataValue('documents');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('documents', JSON.stringify(value || []));
        }
    },
    notes: {
        type: DataTypes.TEXT,
        comment: '특이사항',
    },
}, {
    tableName: 'trainees',
    indexes: [
        { fields: ['name'] },
        { fields: ['trainee_number'] },
        { fields: ['status'] },
        { fields: ['trainee_type'] },
        { fields: ['employment_status'] },
    ],
});

export default Trainee;
