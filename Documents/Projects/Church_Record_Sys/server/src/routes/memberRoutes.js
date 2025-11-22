import express from 'express';
import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  searchMembers,
  getMembersByDepartment
} from '../controllers/memberController.js';
import { authenticate, dataEntryOrAdmin, adminOnly } from '../middleware/auth.js';
import { validateMember, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible by data-entry and admin
router.get('/', dataEntryOrAdmin, getMembers);
router.get('/search', dataEntryOrAdmin, searchMembers);
router.get('/department/:departmentId', dataEntryOrAdmin, getMembersByDepartment);
router.get('/:id', dataEntryOrAdmin, getMember);
router.post('/', dataEntryOrAdmin, validateMember, handleValidationErrors, createMember);
router.put('/:id', dataEntryOrAdmin, validateMember, handleValidationErrors, updateMember);

// Admin only routes
router.delete('/:id', adminOnly, deleteMember);

export default router;