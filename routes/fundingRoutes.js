import express from 'express';
import { addFundingRecord, getFundingByStartup, getFundingSummary, getAllFunding } from '../controllers/fundingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin')); // Can adjust if Founder needs access to specific routes

router.route('/')
    .post(addFundingRecord)
    .get(getAllFunding);

router.get('/startup/:id', getFundingByStartup);
router.get('/summary', getFundingSummary);

export default router;
