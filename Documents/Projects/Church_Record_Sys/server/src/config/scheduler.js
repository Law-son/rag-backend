import cron from 'node-cron';
import logger from './logger.js';
import { sendBirthdayNotifications } from '../services/smsService.js';

// Run birthday check daily at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    logger.info('Running daily birthday notification check...');
    await sendBirthdayNotifications();
    logger.info('Birthday notification check completed');
  } catch (error) {
    logger.error('Error in birthday notification scheduler:', error);
  }
}, {
  timezone: 'Africa/Lagos' // Adjust timezone as needed
});

logger.info('Birthday notification scheduler initialized');