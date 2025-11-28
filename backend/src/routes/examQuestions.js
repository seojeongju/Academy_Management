import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    getExamQuestions,
    getExamQuestion,
    createExamQuestion,
    updateExamQuestion,
    deleteExamQuestion,
    getQuestionStats,
    uploadPDFQuestions,
    batchCreateQuestions
} from '../controllers/examQuestionController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics route (must come before /:id)
router.get('/stats/overview', authorize('teacher', 'admin'), getQuestionStats);

// PDF upload route
router.post('/upload-pdf', authorize('teacher', 'admin'), upload.single('pdf'), uploadPDFQuestions);

// Batch create questions
router.post('/batch', authorize('teacher', 'admin'), batchCreateQuestions);

// CRUD routes
router.route('/')
    .get(authorize('teacher', 'admin'), getExamQuestions)
    .post(authorize('teacher', 'admin'), createExamQuestion);

router.route('/:id')
    .get(getExamQuestion)
    .put(authorize('teacher', 'admin'), updateExamQuestion)
    .delete(authorize('teacher', 'admin'), deleteExamQuestion);

export default router;
