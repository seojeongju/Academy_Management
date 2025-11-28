import { ExamQuestion, Course, User } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

// @desc    Get all exam questions
// @route   GET /api/exam-questions
// @access  Private (Teacher/Admin)
export const getExamQuestions = async (req, res, next) => {
    try {
        const {
            courseId,
            type,
            difficulty,
            ncsUnitCode,
            search,
            page = 1,
            limit = 20
        } = req.query;

        const where = {};

        if (courseId) where.course_id = courseId;
        if (type) where.type = type;
        if (difficulty) where.difficulty = difficulty;
        if (ncsUnitCode) where.ncs_unit_code = ncsUnitCode;

        // Search in question text
        if (search) {
            where.question_text = { [Op.like]: `%${search}%` };
        }

        // If not admin, only show own questions
        if (req.user.role !== 'admin') {
            where.teacher_id = req.user.id;
        }

        const offset = (page - 1) * limit;

        const { count, rows: questions } = await ExamQuestion.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'name']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json({
            success: true,
            data: questions,
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

// @desc    Get single exam question
// @route   GET /api/exam-questions/:id
// @access  Private
export const getExamQuestion = async (req, res, next) => {
    try {
        const question = await ExamQuestion.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'name']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: '문제를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: question
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create exam question
// @route   POST /api/exam-questions
// @access  Private (Teacher/Admin)
export const createExamQuestion = async (req, res, next) => {
    try {
        const questionData = {
            ...req.body,
            teacher_id: req.user.id
        };

        const question = await ExamQuestion.create(questionData);

        res.status(201).json({
            success: true,
            message: '문제가 등록되었습니다.',
            data: question
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update exam question
// @route   PUT /api/exam-questions/:id
// @access  Private (Teacher/Admin)
export const updateExamQuestion = async (req, res, next) => {
    try {
        const question = await ExamQuestion.findByPk(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: '문제를 찾을 수 없습니다.'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && question.teacher_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 문제를 수정할 권한이 없습니다.'
            });
        }

        await question.update(req.body);

        res.json({
            success: true,
            message: '문제가 업데이트되었습니다.',
            data: question
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete exam question
// @route   DELETE /api/exam-questions/:id
// @access  Private (Teacher/Admin)
export const deleteExamQuestion = async (req, res, next) => {
    try {
        const question = await ExamQuestion.findByPk(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: '문제를 찾을 수 없습니다.'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && question.teacher_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '이 문제를 삭제할 권한이 없습니다.'
            });
        }

        await question.destroy();

        res.json({
            success: true,
            message: '문제가 삭제되었습니다.'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get question statistics
// @route   GET /api/exam-questions/stats/overview
// @access  Private
export const getQuestionStats = async (req, res, next) => {
    try {
        const where = {};

        // If not admin, only show own stats
        if (req.user.role !== 'admin') {
            where.teacher_id = req.user.id;
        }

        const totalQuestions = await ExamQuestion.count({ where });

        const byType = await ExamQuestion.findAll({
            where,
            attributes: [
                'type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['type']
        });

        const byDifficulty = await ExamQuestion.findAll({
            where,
            attributes: [
                'difficulty',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['difficulty']
        });

        res.json({
            success: true,
            data: {
                total: totalQuestions,
                byType: byType.map(item => ({
                    type: item.type,
                    count: parseInt(item.get('count'))
                })),
                byDifficulty: byDifficulty.map(item => ({
                    difficulty: item.difficulty,
                    count: parseInt(item.get('count'))
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload PDF and parse questions
// @route   POST /api/exam-questions/upload-pdf
// @access  Private (Teacher/Admin)
export const uploadPDFQuestions = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'PDF 파일을 업로드해주세요.'
            });
        }

        // Import parser (dynamic import to avoid issues)
        const { processPDFQuestions } = await import('../services/pdfParser.js');

        // Process PDF and extract questions
        const result = await processPDFQuestions(req.file.path);

        // Add teacher_id to each question
        const questionsWithTeacher = result.questions.map(q => ({
            ...q,
            teacher_id: req.user.id
        }));

        res.json({
            success: true,
            message: `${result.totalQuestions}개의 문제가 파싱되었습니다.`,
            data: {
                questions: questionsWithTeacher,
                totalQuestions: result.totalQuestions
            }
        });

    } catch (error) {
        console.error('PDF upload error:', error);
        next(error);
    }
};

// @desc    Batch create questions from parsed PDF
// @route   POST /api/exam-questions/batch
// @access  Private (Teacher/Admin)
export const batchCreateQuestions = async (req, res, next) => {
    try {
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: '등록할 문제가 없습니다.'
            });
        }

        // Add teacher_id to all questions
        const questionsWithTeacher = questions.map(q => ({
            ...q,
            teacher_id: req.user.id
        }));

        // Bulk create
        const createdQuestions = await ExamQuestion.bulkCreate(questionsWithTeacher);

        res.status(201).json({
            success: true,
            message: `${createdQuestions.length}개의 문제가 등록되었습니다.`,
            data: createdQuestions
        });

    } catch (error) {
        next(error);
    }
};
