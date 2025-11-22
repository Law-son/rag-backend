import express from 'express';
import {
  sendManualSMS,
  getSMSHistory,
  sendBulkSMS,
  testSMS,
  getSMSBalance,
  getSMSProgress,
  streamSMSProgress,
  triggerBirthdayNotifications
} from '../controllers/smsController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, adminOnly);

const validateSMS = [
  body('title')
    .notEmpty()
    .withMessage('SMS title is required')
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 160 })
    .withMessage('Message must not exceed 160 characters'),
  
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required')
];

const validateBulkSMS = [
  body('title')
    .notEmpty()
    .withMessage('SMS title is required')
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 160 })
    .withMessage('Message must not exceed 160 characters'),
  
  body('filters')
    .isObject()
    .withMessage('Filters object is required')
];

router.post('/send', validateSMS, handleValidationErrors, sendManualSMS);
router.post('/bulk', validateBulkSMS, handleValidationErrors, sendBulkSMS);
router.get('/history', getSMSHistory);
router.get('/balance', getSMSBalance);
router.get('/progress/:sessionId', getSMSProgress);
router.get('/progress/:sessionId/stream', streamSMSProgress);
router.post('/test', testSMS);
router.post('/birthday', triggerBirthdayNotifications);

export default router;