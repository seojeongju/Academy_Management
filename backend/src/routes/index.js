import express from 'express';
import authRoutes from './auth.js';
import studentRoutes from './students.js';
import consultationRoutes from './consultations.js';
import examQuestionRoutes from './examQuestions.js';
import examRoutes from './exams.js';
import examSubmissionRoutes from './examSubmissions.js';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/exam-questions', examQuestionRoutes);
router.use('/exams', examRoutes);
router.use('/exam-submissions', examSubmissionRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

export default router;
