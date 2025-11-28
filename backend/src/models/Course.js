import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '강좌명',
    },
    subject: {
        type: DataTypes.STRING(50),
        comment: '과목 (수학, 영어 등)',
    },
    grade_level: {
        type: DataTypes.STRING(20),
        comment: '대상 학년',
    },
    teacher_id: {
        type: DataTypes.UUID,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    schedule: {
        type: DataTypes.JSONB,
        comment: '수업 시간표 JSON',
        defaultValue: [],
    },
    max_students: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
        comment: '최대 정원',
    },
    tuition_fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '수강료',
    },
    material_fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '교재비',
    },
    start_date: {
        type: DataTypes.DATEONLY,
    },
    end_date: {
        type: DataTypes.DATEONLY,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    description: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'courses',
    indexes: [
        { fields: ['teacher_id'] },
        { fields: ['is_active'] },
    ],
});

export default Course;
