import express from 'express';
import {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentStats
} from '../controllers/studentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics
router.get('/stats/overview', getStudentStats);

// CRUD operations
router.route('/')
    .get(getStudents)
    .post(createStudent);

router.route('/:id')
    .get(getStudent)
    .put(updateStudent)
    .delete(authorize('admin'), deleteStudent); // Only admin can delete

export default router;
