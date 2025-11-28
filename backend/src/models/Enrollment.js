import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    enrollment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        defaultValue: 'active',
    },
}, {
    tableName: 'enrollments',
    indexes: [
        { fields: ['student_id'] },
        { fields: ['course_id'] },
        { unique: true, fields: ['student_id', 'course_id'] },
    ],
});

export default Enrollment;
