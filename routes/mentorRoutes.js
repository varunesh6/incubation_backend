import express from 'express';
import {
    getAssignedStartups,
    provideFeedback,
    getStartupProgress,
    getDevelopers,
    assignTaskToDeveloper,
    getAssignedTasksForMentor,
    evaluateTask,
    handleTaskExtension,
    finalizeStartup
} from '../controllers/mentorController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Mentor'));

router.get('/startups', getAssignedStartups);
router.post('/startups/:id/feedback', upload.single('document'), provideFeedback);
router.get('/startups/:id/progress', getStartupProgress);
router.patch('/startups/:id/status', finalizeStartup);

// Get list of all developers for assignment
router.get('/developers', getDevelopers);

// Developer Tasks Management
router.post('/startups/:id/tasks', assignTaskToDeveloper);
router.get('/tasks', getAssignedTasksForMentor);
router.put('/tasks/:id/evaluate', evaluateTask);
router.put('/tasks/:id/extension', handleTaskExtension);

export default router;
