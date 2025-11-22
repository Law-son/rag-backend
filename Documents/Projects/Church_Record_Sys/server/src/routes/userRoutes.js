import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/userController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validateUser, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/', getUsers);
router.post('/', validateUser, handleValidationErrors, createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;