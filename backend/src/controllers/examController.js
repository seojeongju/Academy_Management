import { Exam, ExamQuestion, ExamSubmission, Course, Trainee, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res, next) => {
    try {
        const {
            courseId,
            examType,
            isActive,
            page = 1,
            limit = 20
        } = req.query;

        const where = {};

        if (courseId) where.course_id = courseId;
        if (examType) where.exam_type = examType;
        if (isActive !== undefined) where.is_active = isActive === 'true';

        // If not admin, only show own exams
        if (req.user.role !== 'admin') {
            where.teacher_id = req.user.id;
        }

        const offset = (page - 1) * limit;

        const { count, rows: exams } = await Exam.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['start_time', 'DESC']],
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'name']
                },
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json({
            success: true,
            data: exams,
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

// @desc    Create exam
// @route   POST /api/exams
// @access  Private (Teacher/Admin)
export const createExam = async (req, res, next) => {
    try {
        const examData = {
            ...req.body,
            teacher_id: req.user.id
        };

        const exam = await Exam.create(examData);

        res.status(201).json({
            success: true,
            message: '시험이 생성되었습니다.',
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get student's available exams
// @route   GET /api/exams/student/available
// @access  Private (Student)
export const getAvailableExams = async (req, res, next) => {
    try {
        const traineeId = req.user.traineeId; // Assuming trainee ID is attached to user

        if (!traineeId) {
            return res.status(400).json({
                success: false,
                message: '훈련생 정보를 찾을 수 없습니다.'
            });
        }

        const now = new Date();

        const exams = await Exam.findAll({
            where: {
                is_active: true,
                start_time: { [Op.lte]: now },
                end_time: { [Op.gte]: now }
            },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'name']
                }
            ]
        });

        // Check which exams student has already submitted
        const examIds = exams.map(exam => exam.id);
        const submissions = await ExamSubmission.findAll({
            where: {
                exam_id: { [Op.in]: examIds },
                trainee_id: traineeId
            },
            attributes: ['exam_id', 'submitted_at', 'score']
        });

        const submissionMap = submissions.reduce((map, sub) => {
            map[sub.exam_id] = sub;
            return map;
        }, {});

        const examsWithStatus = exams.map(exam => ({
            ...exam.toJSON(),
            submission: submissionMap[exam.id] || null,
            can_take: !submissionMap[exam.id]
        }));

        res.json({
            success: true,
            data: examsWithStatus
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Start exam (get exam questions for student)
// @route   GET /api/exams/:id/start
// @access  Private (Student)
export const startExam = async (req, res, next) => {
    try {
        const traineeId = req.user.traineeId;
        const examId = req.params.id;

        // Check if exam exists and is available
        const exam = await Exam.findByPk(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: '시험을 찾을 수 없습니다.'
            });
        }

        const now = new Date();
        if (now < exam.start_time || now > exam.end_time) {
            return res.status(403).json({
                success: false,
                message: '시험 응시 가능 시간이 아닙니다.'
            });
        }

        // Check if already submitted
        const existingSubmission = await ExamSubmission.findOne({
            where: {
                exam_id: examId,
                trainee_id: traineeId
            }
        });

        if (existingSubmission && existingSubmission.submitted_at) {
            return res.status(403).json({
                success: false,
                message: '이미 응시한 시험입니다.'
            });
        }

        // Get questions
        const questionIds = exam.questions.map(q => q.question_id);
        const questions = await ExamQuestion.findAll({
            where: {
                id: { [Op.in]: questionIds }
            },
            attributes: { exclude: ['correct_answer', 'explanation'] } // Don't send answers
        });

        // Create or update submission record
        let submission;
        if (existingSubmission) {
            submission = existingSubmission;
            submission.started_at = now;
            await submission.save();
        } else {
            submission = await ExamSubmission.create({
                exam_id: examId,
                trainee_id: traineeId,
                started_at: now,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
        }

        // Shuffle questions if needed
        let finalQuestions = questions;
        if (exam.shuffle_questions) {
            finalQuestions = questions.sort(() => Math.random() - 0.5);
        }

        res.json({
            success: true,
            data: {
                exam: {
                    id: exam.id,
                    title: exam.title,
                    description: exam.description,
                    total_score: exam.total_score,
                    time_limit: exam.time_limit,
                    prevent_browser_exit: exam.prevent_browser_exit
                },
                questions: finalQuestions,
                submission_id: submission.id,
                started_at: submission.started_at
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit exam
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
export const submitExam = async (req, res, next) => {
    try {
        const traineeId = req.user.traineeId;
        const examId = req.params.id;
        const { answers, time_taken, browser_exit_count } = req.body;

        const exam = await Exam.findByPk(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: '시험을 찾을 수 없습니다.'
            });
        }

        const submission = await ExamSubmission.findOne({
            where: {
                exam_id: examId,
                trainee_id: traineeId
            }
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: '시험 응시 기록을 찾을 수 없습니다.'
            });
        }

        if (submission.submitted_at) {
            return res.status(403).json({
                success: false,
                message: '이미 제출한 시험입니다.'
            });
        }

        // Get questions with correct answers
        const questionIds = exam.questions.map(q => q.question_id);
        const questions = await ExamQuestion.findAll({
            where: {
                id: { [Op.in]: questionIds }
            }
        });

        // Auto-grade objective questions
        let totalScore = 0;
        const questionMap = questions.reduce((map, q) => {
            map[q.id] = q;
            return map;
        }, {});

        const questionScoreMap = exam.questions.reduce((map, q) => {
            map[q.question_id] = q.score;
            return map;
        }, {});

        Object.keys(answers).forEach(questionId => {
            const question = questionMap[questionId];
            if (!question) return;

            const studentAnswer = answers[questionId];
            const correctAnswer = question.correct_answer;
            const questionScore = questionScoreMap[questionId] || question.score_weight;

            // Auto-grade for objective questions
            if (['multiple_choice', 'true_false'].includes(question.type)) {
                if (studentAnswer === correctAnswer) {
                    totalScore += questionScore;
                }
            } else if (question.type === 'multiple_answer') {
                // For multiple answer, check if arrays match
                const studentAnswerArray = Array.isArray(studentAnswer) ? studentAnswer.sort() : [];
                const correctAnswerArray = JSON.parse(correctAnswer).sort();

                if (JSON.stringify(studentAnswerArray) === JSON.stringify(correctAnswerArray)) {
                    totalScore += questionScore;
                }
            }
            // Subjective questions (short_answer, essay) need manual grading
        });

        // Determine grading status
        const hasSubjective = questions.some(q =>
            ['short_answer', 'essay'].includes(q.type)
        );

        const gradingStatus = hasSubjective ? 'auto_graded' : 'completed';

        // Update submission
        submission.submitted_answers = answers;
        submission.submitted_at = new Date();
        submission.time_taken = time_taken;
        submission.browser_exit_count = browser_exit_count || 0;
        submission.score = totalScore;
        submission.percentage = (totalScore / exam.total_score) * 100;
        submission.grading_status = gradingStatus;

        if (gradingStatus === 'completed') {
            submission.graded_at = new Date();
        }

        await submission.save();

        // Update exam statistics
        await updateExamStatistics(examId);

        res.json({
            success: true,
            message: '시험이 제출되었습니다.',
            data: {
                submission_id: submission.id,
                score: gradingStatus === 'completed' ? submission.score : null,
                grading_status: gradingStatus,
                show_results: exam.show_results_immediately && gradingStatus === 'completed'
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to update exam statistics
async function updateExamStatistics(examId) {
    const submissions = await ExamSubmission.findAll({
        where: {
            exam_id: examId,
            grading_status: 'completed'
        }
    });

    if (submissions.length === 0) return;

    const totalScore = submissions.reduce((sum, sub) => sum + parseFloat(sub.score), 0);
    const averageScore = totalScore / submissions.length;

    await Exam.update(
        {
            total_submissions: submissions.length,
            average_score: averageScore.toFixed(2)
        },
        {
            where: { id: examId }
        }
    );
}

// @desc    Get exam results
// @route   GET /api/exams/:id/results
// @access  Private
export const getExamResults = async (req, res, next) => {
    try {
        const examId = req.params.id;
        const traineeId = req.user.traineeId;

        const exam = await Exam.findByPk(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: '시험을 찾을 수 없습니다.'
            });
        }

        const submission = await ExamSubmission.findOne({
            where: {
                exam_id: examId,
                trainee_id: traineeId
            }
        });

        if (!submission || !submission.submitted_at) {
            return res.status(404).json({
                success: false,
                message: '응시 기록을 찾을 수 없습니다.'
            });
        }

        // Get questions with correct answers if review is allowed
        let questionsWithAnswers = null;

        if (exam.allow_review && submission.grading_status === 'completed') {
            const questionIds = exam.questions.map(q => q.question_id);
            const questions = await ExamQuestion.findAll({
                where: {
                    id: { [Op.in]: questionIds }
                }
            });

            questionsWithAnswers = questions.map(q => ({
                id: q.id,
                question_text: q.question_text,
                type: q.type,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                student_answer: submission.submitted_answers[q.id],
                is_correct: checkAnswer(q, submission.submitted_answers[q.id])
            }));
        }

        res.json({
            success: true,
            data: {
                exam: {
                    title: exam.title,
                    total_score: exam.total_score,
                    average_score: exam.average_score
                },
                submission: {
                    score: submission.score,
                    percentage: submission.percentage,
                    time_taken: submission.time_taken,
                    submitted_at: submission.submitted_at,
                    grading_status: submission.grading_status,
                    feedback: submission.feedback
                },
                questions: questionsWithAnswers
            }
        });
    } catch (error) {
        next(error);
    }
};

function checkAnswer(question, studentAnswer) {
    if (['multiple_choice', 'true_false'].includes(question.type)) {
        return studentAnswer === question.correct_answer;
    } else if (question.type === 'multiple_answer') {
        const studentAnswerArray = Array.isArray(studentAnswer) ? studentAnswer.sort() : [];
        const correctAnswerArray = JSON.parse(question.correct_answer).sort();
        return JSON.stringify(studentAnswerArray) === JSON.stringify(correctAnswerArray);
    }
    return null; // Subjective questions
}

export { updateExamStatistics };
