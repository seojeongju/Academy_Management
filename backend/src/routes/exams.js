import express from 'express';
import {
    getExams,
    createExam,
    getAvailableExams,
    startExam,
    submitExam,
    getExamResults
} from '../controllers/examController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.get('/student/available', getAvailableExams);
router.get('/:id/start', startExam);
router.post('/:id/submit', submitExam);
router.get('/:id/results', getExamResults);

// Teacher/Admin routes
router.route('/')
    .get(authorize('admin', 'teacher'), getExams)
    .post(authorize('admin', 'teacher'), createExam);

export default router;
