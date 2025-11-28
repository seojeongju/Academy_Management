import { Exam, ExamQuestion, ExamSubmission, Course, Enrollment, Trainee } from '../models/index.js';
import { Op } from 'sequelize';

// @desc    Get available exams for the logged-in student
// @route   GET /api/exam-submissions/available
// @access  Private (Student)
export const getAvailableExams = async (req, res, next) => {
    try {
        const trainee = req.user.trainee_profile;
        if (!trainee) {
            return res.status(403).json({
                success: false,
                message: '학생 프로필을 찾을 수 없습니다.'
            });
        }

        // 1. Find enrolled courses
        const enrollments = await Enrollment.findAll({
            where: {
                student_id: trainee.id,
                status: 'active'
            },
            include: [{ model: Course, as: 'course' }]
        });

        const courseIds = enrollments.map(e => e.course_id);

        // 2. Find active exams for these courses
        const now = new Date();
        const exams = await Exam.findAll({
            where: {
                course_id: { [Op.in]: courseIds },
                is_active: true,
                start_time: { [Op.lte]: now },
                end_time: { [Op.gte]: now }
            },
            include: [{
                model: Course,
                as: 'course',
                attributes: ['name']
            }]
        });

        // 3. Check submission status for each exam
        const examsWithStatus = await Promise.all(exams.map(async (exam) => {
            const submission = await ExamSubmission.findOne({
                where: {
                    exam_id: exam.id,
                    trainee_id: trainee.id
                }
            });

            return {
                id: exam.id,
                title: exam.title,
                course_title: exam.course.name,
                exam_type: exam.exam_type,
                start_time: exam.start_time,
                end_time: exam.end_time,
                time_limit: exam.time_limit,
                status: submission ? submission.grading_status : 'not_started',
                submission_id: submission ? submission.id : null,
                score: submission ? submission.score : null,
                total_score: exam.total_score
            };
        }));

        res.json({
            success: true,
            data: examsWithStatus
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Start an exam (Get questions)
// @route   POST /api/exam-submissions/:examId/start
// @access  Private (Student)
export const startExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const trainee = req.user.trainee_profile;

        const exam = await Exam.findByPk(examId);
        if (!exam) {
            return res.status(404).json({ success: false, message: '시험을 찾을 수 없습니다.' });
        }

        // Check if exam is available
        const now = new Date();
        if (now < new Date(exam.start_time) || now > new Date(exam.end_time)) {
            return res.status(400).json({ success: false, message: '시험 응시 기간이 아닙니다.' });
        }

        // Check or create submission
        let submission = await ExamSubmission.findOne({
            where: { exam_id: examId, trainee_id: trainee.id }
        });

        if (submission && submission.grading_status !== 'pending') {
            return res.status(400).json({ success: false, message: '이미 응시를 완료한 시험입니다.' });
        }

        if (!submission) {
            submission = await ExamSubmission.create({
                exam_id: examId,
                trainee_id: trainee.id,
                started_at: new Date(),
                grading_status: 'pending'
            });
        }

        // Get questions details
        // exam.questions is array of { id, score }
        const questionIds = exam.questions.map(q => q.id);
        const questions = await ExamQuestion.findAll({
            where: { id: { [Op.in]: questionIds } },
            attributes: { exclude: ['correct_answer', 'explanation', 'teacher_id'] } // Hide answers
        });

        // Map score from exam config to question
        const questionsWithScore = questions.map(q => {
            const config = exam.questions.find(c => c.id === q.id);
            return {
                ...q.toJSON(),
                score: config ? config.score : q.score_weight
            };
        });

        res.json({
            success: true,
            data: {
                exam: {
                    id: exam.id,
                    title: exam.title,
                    time_limit: exam.time_limit,
                    end_time: exam.end_time
                },
                submission_id: submission.id,
                questions: questionsWithScore
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Submit exam answers
// @route   POST /api/exam-submissions/:examId/submit
// @access  Private (Student)
export const submitExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { answers, time_taken } = req.body; // answers: { questionId: answer }
        const trainee = req.user.trainee_profile;

        const submission = await ExamSubmission.findOne({
            where: { exam_id: examId, trainee_id: trainee.id }
        });

        if (!submission) {
            return res.status(404).json({ success: false, message: '응시 기록을 찾을 수 없습니다.' });
        }

        if (submission.grading_status !== 'pending') {
            return res.status(400).json({ success: false, message: '이미 제출된 시험입니다.' });
        }

        const exam = await Exam.findByPk(examId);

        // Calculate Score
        let totalScore = 0;
        let earnedScore = 0;
        const questionFeedback = {};

        // Get all questions with answers
        const questionIds = exam.questions.map(q => q.id);
        const questions = await ExamQuestion.findAll({
            where: { id: { [Op.in]: questionIds } }
        });

        questions.forEach(q => {
            const config = exam.questions.find(c => c.id === q.id);
            const maxScore = config ? parseInt(config.score) : q.score_weight;
            totalScore += maxScore;

            const studentAnswer = answers[q.id];
            let isCorrect = false;

            // Simple grading logic
            if (q.type === 'multiple_choice' || q.type === 'true_false') {
                if (String(studentAnswer) === String(q.correct_answer)) {
                    isCorrect = true;
                }
            } else if (q.type === 'short_answer') {
                if (studentAnswer && String(studentAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
                    isCorrect = true;
                }
            }
            // Essay type needs manual grading

            if (isCorrect) {
                earnedScore += maxScore;
            }

            questionFeedback[q.id] = {
                is_correct: isCorrect,
                student_answer: studentAnswer,
                correct_answer: q.correct_answer, // 나중에 결과 공개 시 사용
                score: isCorrect ? maxScore : 0
            };
        });

        // Update submission
        submission.submitted_answers = answers;
        submission.submitted_at = new Date();
        submission.time_taken = time_taken;
        submission.score = earnedScore;
        submission.percentage = (earnedScore / totalScore) * 100;
        submission.question_feedback = questionFeedback;
        submission.grading_status = 'auto_graded'; // Or 'manually_graded' if essay exists

        await submission.save();

        // Update exam statistics (async)
        exam.increment('total_submissions');

        res.json({
            success: true,
            message: '시험이 제출되었습니다.',
            data: {
                submission_id: submission.id,
                score: earnedScore,
                total_score: totalScore,
                percentage: submission.percentage
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get exam submission details (Result)
// @route   GET /api/exam-submissions/:submissionId
// @access  Private (Student)
export const getExamSubmission = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const trainee = req.user.trainee_profile;

        const submission = await ExamSubmission.findOne({
            where: {
                id: submissionId,
                trainee_id: trainee.id
            },
            include: [{
                model: Exam,
                as: 'exam',
                attributes: ['title', 'total_score', 'questions'],
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['name']
                }]
            }]
        });

        if (!submission) {
            return res.status(404).json({ success: false, message: '시험 결과를 찾을 수 없습니다.' });
        }

        // Get questions details including correct answer and explanation
        const questionIds = submission.exam.questions.map(q => q.id);
        const questions = await ExamQuestion.findAll({
            where: { id: { [Op.in]: questionIds } }
        });

        // Combine question info with submission feedback
        const feedback = submission.question_feedback || {};
        const questionsWithFeedback = questions.map(q => {
            const qFeedback = feedback[q.id] || {};
            const config = submission.exam.questions.find(c => c.id === q.id);

            return {
                ...q.toJSON(),
                score_weight: config ? config.score : q.score_weight,
                student_answer: submission.submitted_answers ? submission.submitted_answers[q.id] : null,
                is_correct: qFeedback.is_correct,
                earned_score: qFeedback.score
            };
        });

        res.json({
            success: true,
            data: {
                exam: {
                    title: submission.exam.title,
                    course_name: submission.exam.course.name,
                    total_score: submission.exam.total_score
                },
                submission: {
                    score: submission.score,
                    percentage: submission.percentage,
                    submitted_at: submission.submitted_at,
                    time_taken: submission.time_taken
                },
                questions: questionsWithFeedback
            }
        });

    } catch (error) {
        next(error);
    }
};
