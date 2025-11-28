import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    student_number: {
        type: DataTypes.STRING(20),
        unique: true,
        comment: '학생 번호 (출결용)',
    },
    phone: {
        type: DataTypes.STRING(20),
    },
    parent_phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    parent_name: {
        type: DataTypes.STRING(50),
    },
    school: {
        type: DataTypes.STRING(100),
    },
    grade: {
        type: DataTypes.INTEGER,
        comment: '학년',
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'graduated', 'waiting', 'withdrawn'),
        defaultValue: 'active',
        allowNull: false,
        comment: '재원/휴원/졸업/대기/퇴원',
    },
    enrollment_route: {
        type: DataTypes.STRING(100),
        comment: '등원 경로 (추천, 온라인 등)',
    },
    address: {
        type: DataTypes.TEXT,
    },
    birth_date: {
        type: DataTypes.DATEONLY,
    },
    enrollment_date: {
        type: DataTypes.DATEONLY,
        comment: '입원일',
    },
    notes: {
        type: DataTypes.TEXT,
        comment: '특이사항',
    },
    tags: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        comment: '커스텀 태그 (#상위권, #차량이용 등) - JSON 문자열',
        get() {
            const rawValue = this.getDataValue('tags');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('tags', JSON.stringify(value || []));
        }
    },
}, {
    tableName: 'students',
    indexes: [
        { fields: ['name'] },
        { fields: ['student_number'] },
        { fields: ['status'] },
    ],
});

export default Student;
