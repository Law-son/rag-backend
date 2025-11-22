import express from 'express';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { authenticate, dataEntryOrAdmin, adminOnly } from '../middleware/auth.js';
import { validateDepartment, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible by data-entry and admin
router.get('/', dataEntryOrAdmin, getDepartments);
router.get('/:id', dataEntryOrAdmin, getDepartment);

// Admin only routes
router.post('/', adminOnly, validateDepartment, handleValidationErrors, createDepartment);
router.put('/:id', adminOnly, validateDepartment, handleValidationErrors, updateDepartment);
router.delete('/:id', adminOnly, deleteDepartment);

export default router;