import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getAvailableExams,
    startExam,
    submitExam,
    getExamSubmission
} from '../controllers/examSubmissionController.js';

const router = express.Router();

// 모든 라우트는 인증 필요
router.use(authenticate);

// 학생용 라우트
router.get('/available', authorize('student'), getAvailableExams);
router.post('/:examId/start', authorize('student'), startExam);
router.post('/:examId/submit', authorize('student'), submitExam);
router.get('/:submissionId', authorize('student'), getExamSubmission);

export default router;
