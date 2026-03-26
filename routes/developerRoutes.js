import express from 'express';
import {
    getMyTasks,
    submitTaskProgress,
    requestExtension
} from '../controllers/developerController.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

const router = express.Router();

router.use(protect);
router.use(authorize('Developer', 'Mentor'));

// Developer Tasks Management
router.get('/tasks', getMyTasks);
router.put('/tasks/:id/submit', upload.single('work_completion_file'), submitTaskProgress);
router.post('/tasks/:id/extend', requestExtension);

export default router;
