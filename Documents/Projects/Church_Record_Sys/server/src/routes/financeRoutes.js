import express from 'express';
import {
  getFinanceRecords,
  createFinanceRecord,
  updateFinanceRecord,
  deleteFinanceRecord,
  getFinanceReports,
  generatePDFReport
} from '../controllers/financeController.js';
import { authenticate, dataEntryOrAdmin, adminOnly } from '../middleware/auth.js';
import { validateFinanceRecord, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible by data-entry and admin
router.get('/', dataEntryOrAdmin, getFinanceRecords);
router.post('/', dataEntryOrAdmin, validateFinanceRecord, handleValidationErrors, createFinanceRecord);
router.put('/:id', dataEntryOrAdmin, validateFinanceRecord, handleValidationErrors, updateFinanceRecord);

// Admin only routes
router.delete('/:id', adminOnly, deleteFinanceRecord);
router.get('/reports', adminOnly, getFinanceReports);
router.get('/reports/pdf', adminOnly, generatePDFReport);

export default router;