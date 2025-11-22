import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticate, dataEntryOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, dataEntryOrAdmin);

router.get('/stats', getDashboardStats);

export default router;