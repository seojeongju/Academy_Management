import { Trainee, Consultation, Enrollment, Course, User } from '../models/index.js';
import { Op } from 'sequelize';

// @desc    Get all trainees (students)
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res, next) => {
    try {
        const {
            status,
            traineeType,
            search,
            grade,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            order = 'DESC'
        } = req.query;

        const where = {};

        if (status) where.status = status;
        if (traineeType) where.trainee_type = traineeType;

        // Search by name or phone
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { trainee_number: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows: trainees } = await Trainee.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, order]],
            include: [
                {
                    model: Enrollment,
                    as: 'enrollments',
                    include: [{ model: Course, as: 'course' }]
                }
            ]
        });

        res.json({
            success: true,
            data: trainees,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single trainee
// @route   GET /api/students/:id
// @access  Private
export const getStudent = async (req, res, next) => {
    try {
        const trainee = await Trainee.findByPk(req.params.id, {
            include: [
                {
                    model: Consultation,
                    as: 'consultations',
                    include: [{ model: User, as: 'counselor', attributes: ['id', 'name'] }],
                    order: [['consult_date', 'DESC']]
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    include: [{ model: Course, as: 'course' }]
                }
            ]
        });

        if (!trainee) {
            return res.status(404).json({
                success: false,
                message: '훈련생을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: trainee
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new trainee
// @route   POST /api/students
// @access  Private
export const createStudent = async (req, res, next) => {
    try {
        const trainee = await Trainee.create(req.body);

        res.status(201).json({
            success: true,
            message: '훈련생이 등록되었습니다.',
            data: trainee
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update trainee
// @route   PUT /api/students/:id
// @access  Private
export const updateStudent = async (req, res, next) => {
    try {
        const trainee = await Trainee.findByPk(req.params.id);

        if (!trainee) {
            return res.status(404).json({
                success: false,
                message: '훈련생을 찾을 수 없습니다.'
            });
        }

        await trainee.update(req.body);

        res.json({
            success: true,
            message: '훈련생 정보가 업데이트되었습니다.',
            data: trainee
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete trainee
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
export const deleteStudent = async (req, res, next) => {
    try {
        const trainee = await Trainee.findByPk(req.params.id);

        if (!trainee) {
            return res.status(404).json({
                success: false,
                message: '훈련생을 찾을 수 없습니다.'
            });
        }

        await trainee.destroy();

        res.json({
            success: true,
            message: '훈련생이 삭제되었습니다.'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get trainee statistics
// @route   GET /api/students/stats/overview
// @access  Private
export const getStudentStats = async (req, res, next) => {
    try {
        const totalTrainees = await Trainee.count();
        const activeTrainees = await Trainee.count({ where: { status: 'active' } });
        const inactiveTrainees = await Trainee.count({ where: { status: 'inactive' } });
        const waitingTrainees = await Trainee.count({ where: { status: 'waiting' } });

        // Get new trainees this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const newThisMonth = await Trainee.count({
            where: {
                enrollment_date: {
                    [Op.gte]: firstDayOfMonth
                }
            }
        });

        // Employment statistics
        const employedTrainees = await Trainee.count({
            where: { employment_status: 'employed' }
        });

        res.json({
            success: true,
            data: {
                total: totalTrainees,
                active: activeTrainees,
                inactive: inactiveTrainees,
                waiting: waitingTrainees,
                newThisMonth,
                employed: employedTrainees
            }
        });
    } catch (error) {
        next(error);
    }
};
