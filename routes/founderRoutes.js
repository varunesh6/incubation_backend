import express from 'express';
import { submitStartup, getMyStartups, updateStartup } from '../controllers/founderController.js';
import { getStartupReviews } from '../controllers/sharedController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Founder'));

router.route('/startups')
    .post(submitStartup)
    .get(getMyStartups);

router.route('/startups/:id')
    .put(updateStartup);

router.get('/startups/:id/reviews', getStartupReviews);

export default router;
