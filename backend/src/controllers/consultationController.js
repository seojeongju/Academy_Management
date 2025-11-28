import { Op } from 'sequelize';
import { Consultation, Trainee, User, sequelize } from '../models/index.js';
import { analyzeConsultation } from '../services/aiService.js';

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private
export const getConsultations = async (req, res, next) => {
    try {
        const {
            studentId,
            teacherId,
            category,
            status,
            startDate,
            endDate,
            importance,
            search,
            page = 1,
            limit = 20,
            sortBy = 'consult_date',
            order = 'DESC'
        } = req.query;

        const where = {};

        if (studentId) where.trainee_id = studentId;
        if (teacherId) where.counselor_id = teacherId;
        if (category) where.category = category;
        if (status) where.status = status;
        if (importance) where.importance = { [Op.gte]: importance };

        // Search in content
        if (search) {
            where.content = { [Op.like]: `%${search}%` };
        }

        // Date range filter
        if (startDate || endDate) {
            where.consult_date = {};
            if (startDate) where.consult_date[Op.gte] = new Date(startDate);
            if (endDate) where.consult_date[Op.lte] = new Date(endDate);
        }

        // If user is not admin, only show their consultations
        if (req.user.role !== 'admin') {
            where.counselor_id = req.user.id;
        }

        const offset = (page - 1) * limit;

        const { count, rows: consultations } = await Consultation.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, order]],
            include: [
                {
                    model: Trainee,
                    as: 'trainee',
                    attributes: ['id', 'name', 'trainee_number', 'status']
                },
                {
                    model: User,
                    as: 'counselor',
                    attributes: ['id', 'name', 'role']
                }
            ]
        });

        res.json({
            success: true,
            data: consultations,
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

// @desc    Analyze consultation content using AI
// @route   POST /api/consultations/analyze
// @access  Private
export const analyzeConsultationContent = async (req, res, next) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '분석할 상담 내용을 입력해주세요.'
            });
        }

        const analysis = await analyzeConsultation(content);

        if (!analysis) {
            return res.status(500).json({
                success: false,
                message: 'AI 분석 결과를 생성하지 못했습니다.'
            });
        }

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        next(error);
    }
};
export const getConsultation = async (req, res, next) => {
    try {
        const consultation = await Consultation.findByPk(req.params.id, {
            include: [
                {
                    model: Trainee,
                    as: 'trainee',
                },
                {
                    model: User,
                    as: 'counselor',
                    attributes: ['id', 'name', 'role']
                }
            ]
        });

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 기록을 찾을 수 없습니다.'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && consultation.counselor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 상담 기록에 접근할 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            data: consultation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new consultation
// @route   POST /api/consultations
// @access  Private
export const createConsultation = async (req, res, next) => {
    try {
        const consultationData = {
            ...req.body,
            counselor_id: req.user.id // Set counselor_id from authenticated user
        };

        const consultation = await Consultation.create(consultationData);

        // Fetch the created consultation with associations
        const newConsultation = await Consultation.findByPk(consultation.id, {
            include: [
                {
                    model: Trainee,
                    as: 'trainee',
                    attributes: ['id', 'name', 'trainee_number']
                },
                {
                    model: User,
                    as: 'counselor',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: '상담 기록이 등록되었습니다.',
            data: newConsultation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private
export const updateConsultation = async (req, res, next) => {
    try {
        const consultation = await Consultation.findByPk(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 기록을 찾을 수 없습니다.'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && consultation.counselor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 상담 기록을 수정할 권한이 없습니다.'
            });
        }

        await consultation.update(req.body);

        const updatedConsultation = await Consultation.findByPk(consultation.id, {
            include: [
                { model: Trainee, as: 'trainee', attributes: ['id', 'name', 'trainee_number', 'status'] },
                { model: User, as: 'counselor', attributes: ['id', 'name'] }
            ]
        });

        res.json({
            success: true,
            message: '상담 기록이 업데이트되었습니다.',
            data: updatedConsultation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete consultation
// @route   DELETE /api/consultations/:id
// @access  Private
export const deleteConsultation = async (req, res, next) => {
    try {
        const consultation = await Consultation.findByPk(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '상담 기록을 찾을 수 없습니다.'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && consultation.counselor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 상담 기록을 삭제할 권한이 없습니다.'
            });
        }

        await consultation.destroy();

        res.json({
            success: true,
            message: '상담 기록이 삭제되었습니다.'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get upcoming consultations (follow-ups)
// @route   GET /api/consultations/upcoming/follow-ups
// @access  Private
export const getUpcomingFollowUps = async (req, res, next) => {
    try {
        const where = {
            next_follow_up_date: {
                [Op.gte]: new Date(),
                [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            },
            follow_up_reminder: true
        };

        // If not admin, only show own consultations
        if (req.user.role !== 'admin') {
            where.counselor_id = req.user.id;
        }

        const consultations = await Consultation.findAll({
            where,
            order: [['next_follow_up_date', 'ASC']],
            include: [
                {
                    model: Trainee,
                    as: 'trainee',
                    attributes: ['id', 'name', 'status']
                },
                {
                    model: User,
                    as: 'counselor',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json({
            success: true,
            data: consultations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get today's consultations
// @route   GET /api/consultations/today
// @access  Private
export const getTodayConsultations = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const where = {
            next_follow_up_date: {
                [Op.gte]: today,
                [Op.lt]: tomorrow
            }
        };

        // If not admin, only show own consultations
        if (req.user.role !== 'admin') {
            where.counselor_id = req.user.id;
        }

        const consultations = await Consultation.findAll({
            where,
            order: [['next_follow_up_date', 'ASC']],
            include: [
                {
                    model: Trainee,
                    as: 'trainee',
                },
                {
                    model: User,
                    as: 'counselor',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json({
            success: true,
            data: consultations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get consultation statistics
// @route   GET /api/consultations/stats/overview
// @access  Private
export const getConsultationStats = async (req, res, next) => {
    try {
        const where = {};

        // If not admin, only show own stats
        if (req.user.role !== 'admin') {
            where.counselor_id = req.user.id;
        }

        const totalConsultations = await Consultation.count({ where });

        const byCategory = await Consultation.findAll({
            where,
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['category']
        });

        const byStatus = await Consultation.findAll({
            where,
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        // This month's consultations
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const thisMonthCount = await Consultation.count({
            where: {
                ...where,
                consult_date: {
                    [Op.gte]: firstDayOfMonth
                }
            }
        });

        res.json({
            success: true,
            data: {
                total: totalConsultations,
                thisMonth: thisMonthCount,
                byCategory: byCategory.map(item => ({
                    category: item.category,
                    count: parseInt(item.get('count'))
                })),
                byStatus: byStatus.map(item => ({
                    status: item.status,
                    count: parseInt(item.get('count'))
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};
