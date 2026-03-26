import express from 'express';
import { getPlatformStats, getFundingTrend } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getPlatformStats);
router.get('/funding-trend', getFundingTrend);

export default router;
