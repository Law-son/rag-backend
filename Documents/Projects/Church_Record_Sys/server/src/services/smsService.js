import ArkeselSMSService from './arkeselSmsService.js';
import Member from '../models/Member.js';
import SmsLog from '../models/SmsLog.js';
import logger from '../config/logger.js';

// SMS Service abstraction - supports multiple providers
export const sendSMS = async (phoneNumber, message, senderId = 'ANRCI') => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Mock SMS in development
      logger.info(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
      return { 
        success: true, 
        messageId: `mock_${Date.now()}`,
        provider: 'test'
      };
    }

    // Use Arkesel SMS service
    const result = await ArkeselSMSService.sendSMS(phoneNumber, message, senderId);
    return result;
  } catch (error) {
    logger.error('SMS send error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'unknown'
    };
  }
};

export const sendBulkSMS = async (phoneNumbers, message, senderId = 'ANRCI') => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Mock bulk SMS in development
      logger.info(`[MOCK BULK SMS] To: ${phoneNumbers.length} recipients, Message: ${message}`);
      return {
        success: true,
        totalSent: phoneNumbers.length,
        totalFailed: 0,
        results: phoneNumbers.map(phone => ({
          phoneNumber: phone,
          success: true,
          messageId: `mock_${Date.now()}`,
          provider: 'test'
        }))
      };
    }

    // Use Arkesel bulk SMS service
    const result = await ArkeselSMSService.sendBulkSMS(phoneNumbers, message, senderId);
    return result;
  } catch (error) {
    logger.error('Bulk SMS error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const sendBirthdayNotifications = async () => {
  try {
    // Find members with birthdays today
    const today = new Date();
    const members = await Member.find({
      isActive: true,
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] }
        ]
      }
    }).select('fullName phoneNumber dateOfBirth');

    if (members.length === 0) {
      logger.info('No birthdays today');
      return;
    }

    logger.info(`Found ${members.length} birthdays today`);

    for (const member of members) {
      const message = `Happy Birthday!!!
All Nations Redeemers Chapel International wishes you a glorious birthday. God bless you and have a great day. Cheers`;

      // Create SMS log
      const smsLog = new SmsLog({
        title: `Birthday Wishes - ${member.fullName}`,
        message,
        type: 'birthday',
        provider: 'arkesel',
        recipients: [{
          member: member._id,
          phone: member.phoneNumber,
          status: 'pending'
        }]
      });

      await smsLog.save();

      // Send SMS
      const result = await sendSMS(member.phoneNumber, message, 'ANRCI');
      
      // Update SMS log
      smsLog.status = result.success ? 'sent' : 'failed';
      smsLog.error = result.error;
      smsLog.providerId = result.messageId;
      smsLog.cost = result.cost || 0;
      
      if (smsLog.recipients[0]) {
        smsLog.recipients[0].status = result.success ? 'sent' : 'failed';
        smsLog.recipients[0].error = result.error;
      }

      await smsLog.save();

      logger.info(`Birthday SMS ${result.success ? 'sent' : 'failed'} to ${member.fullName}`);
    }

    logger.info(`Birthday notification process completed for ${members.length} members`);
  } catch (error) {
    logger.error('Birthday notification error:', error);
    throw error;
  }
};