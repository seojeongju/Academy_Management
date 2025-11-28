import express from 'express';
import {
    getConsultations,
    getConsultation,
    createConsultation,
    updateConsultation,
    deleteConsultation,
    getUpcomingFollowUps,
    getTodayConsultations,
    getConsultationStats,
    analyzeConsultationContent
} from '../controllers/consultationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Special routes
router.get('/upcoming/follow-ups', getUpcomingFollowUps);
router.get('/today', getTodayConsultations);
router.get('/stats/overview', getConsultationStats);
router.post('/analyze', analyzeConsultationContent);

// CRUD operations
router.route('/')
    .get(getConsultations)
    .post(createConsultation);

router.route('/:id')
    .get(getConsultation)
    .put(updateConsultation)
    .delete(deleteConsultation);

export default router;
