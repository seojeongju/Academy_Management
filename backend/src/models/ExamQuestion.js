import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ExamQuestion = sequelize.define('ExamQuestion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    teacher_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    course_id: {
        type: DataTypes.UUID,
        references: {
            model: 'courses',
            key: 'id',
        },
    },
    // NCS 매핑
    ncs_unit_code: {
        type: DataTypes.STRING(20),
        comment: 'NCS 능력단위 코드',
    },
    ncs_unit_name: {
        type: DataTypes.STRING(200),
        comment: 'NCS 능력단위명',
    },
    ncs_performance_criteria: {
        type: DataTypes.STRING(200),
        comment: 'NCS 수행준거',
    },
    // 문제 정보
    type: {
        type: DataTypes.ENUM('multiple_choice', 'multiple_answer', 'short_answer', 'essay', 'true_false'),
        allowNull: false,
        comment: '객관식/복수선택/단답형/서술형/OX',
    },
    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium',
        comment: '난이도',
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '문제 지문 (HTML/Markdown)',
    },
    question_image: {
        type: DataTypes.STRING(500),
        comment: '문제 이미지 URL',
    },
    // 객관식 선택지
    options: {
        type: DataTypes.TEXT,
        comment: '선택지 목록 (JSON)',
        get() {
            const rawValue = this.getDataValue('options');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('options', JSON.stringify(value || []));
        }
    },
    // 정답
    correct_answer: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '정답 (객관식: 번호, 주관식: 텍스트, 복수선택: JSON 배열)',
    },
    // 해설
    explanation: {
        type: DataTypes.TEXT,
        comment: '해설',
    },
    // 배점
    score_weight: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: '기본 배점',
    },
    // 태그
    tags: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        comment: '태그 목록 (JSON)',
        get() {
            const rawValue = this.getDataValue('tags');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('tags', JSON.stringify(value || []));
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'exam_questions',
    indexes: [
        { fields: ['teacher_id'] },
        { fields: ['course_id'] },
        { fields: ['type'] },
        { fields: ['difficulty'] },
        { fields: ['ncs_unit_code'] },
    ],
});

export default ExamQuestion;
