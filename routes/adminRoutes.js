import express from 'express';
import { getAllUsers, getAllStartups, updateStartupStatus, assignMentor, completeStartupProject } from '../controllers/adminController.js';
import { getStartupReviews } from '../controllers/sharedController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here are protected and restricted to Admins
router.use(protect);
router.use(authorize('Admin'));

router.get('/users', getAllUsers);
router.get('/startups', getAllStartups);
router.put('/startups/:id/status', updateStartupStatus);
router.post('/startups/:id/assign-mentor', assignMentor);
router.put('/startups/:id/complete', completeStartupProject);
router.get('/startups/:id/reviews', getStartupReviews);

export default router;
