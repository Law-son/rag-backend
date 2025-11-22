import SmsLog from '../models/SmsLog.js';
import Member from '../models/Member.js';
import { sendSMS, sendBulkSMS as sendBulkSMSService, sendBirthdayNotifications } from '../services/smsService.js';
import ArkeselSMSService from '../services/arkeselSmsService.js';
import smsProgressService from '../services/smsProgressService.js';
import logger from '../config/logger.js';

export const sendManualSMS = async (req, res) => {
  try {
    const { title, message, recipients } = req.body;

    // Get member details for recipients
    const members = await Member.find({
      _id: { $in: recipients },
      isActive: true
    }).select('fullName phoneNumber');

    if (members.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid recipients found'
      });
    }

    // Create SMS log entry
    const smsLog = new SmsLog({
      title,
      message,
      type: 'manual',
      provider: 'arkesel',
      sentBy: req.user._id,
      recipients: members.map(member => ({
        member: member._id,
        phone: member.phoneNumber,
        status: 'pending'
      }))
    });

    await smsLog.save();

    // Send SMS to each recipient
    const results = [];
    for (const member of members) {
      try {
        const result = await sendSMS(member.phoneNumber, message, 'ANRCI');
        
        // Update recipient status in log
        const recipient = smsLog.recipients.find(r => 
          r.member.toString() === member._id.toString()
        );
        if (recipient) {
          recipient.status = result.success ? 'sent' : 'failed';
          recipient.error = result.error;
        }

        results.push({
          member: member.fullName,
          phone: member.phoneNumber,
          status: result.success ? 'sent' : 'failed',
          error: result.error
        });
      } catch (error) {
        logger.error(`SMS send error for ${member.phoneNumber}:`, error);
        results.push({
          member: member.fullName,
          phone: member.phoneNumber,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update overall SMS log status
    const successCount = results.filter(r => r.status === 'sent').length;
    smsLog.status = successCount > 0 ? 'sent' : 'failed';
    await smsLog.save();

    logger.info(`Manual SMS sent to ${successCount}/${results.length} recipients by ${req.user.email}`);

    res.json({
      status: 'success',
      message: `SMS sent to ${successCount} out of ${results.length} recipients`,
      data: { results }
    });
  } catch (error) {
    logger.error('Send manual SMS error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error sending SMS'
    });
  }
};

export const sendBulkSMS = async (req, res) => {
  try {
    const { title, message, filters } = req.body;
    
    // Build query based on filters
    const query = { isActive: true };
    if (filters.departments?.length) {
      query.department = { $in: filters.departments };
    }
    if (filters.maritalStatus) {
      query.maritalStatus = filters.maritalStatus;
    }
    if (filters.baptismStatus) {
      query.baptismStatus = filters.baptismStatus;
    }
    if (filters.gender) {
      query.gender = filters.gender;
    }

    const members = await Member.find(query)
      .select('fullName phoneNumber')
      .populate('department', 'name');

    if (members.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No members found matching the criteria'
      });
    }

    // Create SMS log entry
    const smsLog = new SmsLog({
      title,
      message,
      type: 'announcement',
      provider: 'arkesel',
      sentBy: req.user._id,
      recipients: members.map(member => ({
        member: member._id,
        phone: member.phoneNumber,
        status: 'pending'
      }))
    });

    await smsLog.save();

    // Create progress tracking session
    const sessionId = smsProgressService.createSessionId();
    smsProgressService.startProgress(sessionId, members.length, title, message);

    // Send bulk SMS with progress tracking
    const phoneNumbers = members.map(m => m.phoneNumber);
    
    // Start the bulk SMS process asynchronously
    sendBulkSMSWithProgress(sessionId, phoneNumbers, message, smsLog);

    logger.info(`Bulk SMS started for ${members.length} recipients by ${req.user.email}`);

    res.json({
      status: 'success',
      message: `Bulk SMS started for ${members.length} recipients`,
      data: {
        sessionId,
        recipientCount: members.length,
        success: true
      }
    });
  } catch (error) {
    logger.error('Send bulk SMS error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error sending bulk SMS'
    });
  }
};

// Helper function to send bulk SMS with progress tracking
const sendBulkSMSWithProgress = async (sessionId, phoneNumbers, message, smsLog) => {
  try {
    const batchSize = 100;
    const totalBatches = Math.ceil(phoneNumbers.length / batchSize);
    
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batchIndex = Math.floor(i / batchSize);
      const batch = phoneNumbers.slice(i, i + batchSize);
      
      try {
        // Send batch via Arkesel
        const formattedNumbers = batch.map(phone => {
          // Format phone number (same logic as in arkeselSmsService)
          let cleaned = phone.replace(/\D/g, '');
          if (cleaned.startsWith('0')) {
            cleaned = '233' + cleaned.substring(1);
          }
          if (!cleaned.startsWith('233')) {
            cleaned = '233' + cleaned;
          }
          return cleaned;
        });

        const apiUrl = 'https://sms.arkesel.com/sms/api';
        const params = {
          action: 'send-sms',
          api_key: process.env.ARKESEL_API_KEY,
          to: formattedNumbers.join(','),
          from: 'ANRCI',
          sms: message
        };

        const response = await fetch(`${apiUrl}?${new URLSearchParams(params)}`);
        const result = await response.json();

        let batchSent = 0;
        let batchFailed = 0;

        if (result && result.code === 'ok') {
          batchSent = batch.length;
          // Update SMS log recipients for this batch
          const startIndex = i;
          const endIndex = Math.min(i + batchSize, phoneNumbers.length);
          for (let j = startIndex; j < endIndex; j++) {
            if (smsLog.recipients[j]) {
              smsLog.recipients[j].status = 'sent';
            }
          }
        } else {
          batchFailed = batch.length;
          // Update SMS log recipients for this batch
          const startIndex = i;
          const endIndex = Math.min(i + batchSize, phoneNumbers.length);
          for (let j = startIndex; j < endIndex; j++) {
            if (smsLog.recipients[j]) {
              smsLog.recipients[j].status = 'failed';
              smsLog.recipients[j].error = result.message || 'Unknown error';
            }
          }
        }

        // Update progress
        smsProgressService.updateBatchProgress(sessionId, batchIndex, batchSent, batchFailed);

        // Save SMS log after each batch
        await smsLog.save();

        // Add delay between batches to respect rate limits
        if (i + batchSize < phoneNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (batchError) {
        logger.error(`Batch ${batchIndex} error:`, batchError);
        
        // Mark entire batch as failed
        const batchFailed = batch.length;
        const startIndex = i;
        const endIndex = Math.min(i + batchSize, phoneNumbers.length);
        for (let j = startIndex; j < endIndex; j++) {
          if (smsLog.recipients[j]) {
            smsLog.recipients[j].status = 'failed';
            smsLog.recipients[j].error = batchError.message;
          }
        }

        smsProgressService.updateBatchProgress(sessionId, batchIndex, 0, batchFailed);
        await smsLog.save();
      }
    }

    // Final update of SMS log status
    const successCount = smsLog.recipients.filter(r => r.status === 'sent').length;
    smsLog.status = successCount > 0 ? 'sent' : 'failed';
    await smsLog.save();

    logger.info(`Bulk SMS completed for session ${sessionId}: ${successCount}/${phoneNumbers.length} sent`);

  } catch (error) {
    logger.error('Bulk SMS progress error:', error);
    smsProgressService.cancelProgress(sessionId);
  }
};

export const getSMSHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const smsLogs = await SmsLog.find(filter)
      .populate('sentBy', 'firstName lastName')
      .populate('recipients.member', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SmsLog.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        smsLogs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    logger.error('Get SMS history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving SMS history'
    });
  }
};

export const testSMS = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }

    const message = 'Test message from All Nations Redeemers Chapel International Church Management System';
    const result = await sendSMS(phoneNumber, message);

    res.json({
      status: 'success',
      message: 'Test SMS sent',
      data: result
    });
  } catch (error) {
    logger.error('Test SMS error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error sending test SMS'
    });
  }
};

export const getSMSBalance = async (req, res) => {
  try {
    const result = await ArkeselSMSService.getBalance();
    
    if (result.success) {
      res.json({
        status: 'success',
        data: {
          balance: result.balance,
          currency: result.currency
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: result.error || 'Failed to get SMS balance'
      });
    }
  } catch (error) {
    logger.error('Get SMS balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting SMS balance'
    });
  }
};

export const getSMSProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID is required'
      });
    }

    const progress = smsProgressService.getProgress(sessionId);
    
    if (!progress) {
      return res.status(404).json({
        status: 'error',
        message: 'Progress session not found or expired'
      });
    }

    res.json({
      status: 'success',
      data: progress
    });
  } catch (error) {
    logger.error('Get SMS progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting SMS progress'
    });
  }
};

export const streamSMSProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID is required'
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial progress if available
    const initialProgress = smsProgressService.getProgress(sessionId);
    if (initialProgress) {
      res.write(`data: ${JSON.stringify(initialProgress)}\n\n`);
    }

    // Set up event listener for progress updates
    const onProgress = (progressSessionId, progress) => {
      if (progressSessionId === sessionId) {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
        
        // Close connection when complete
        if (progress.isComplete) {
          res.end();
        }
      }
    };

    smsProgressService.on('progress', onProgress);

    // Handle client disconnect
    req.on('close', () => {
      smsProgressService.removeListener('progress', onProgress);
    });

    // Send keep-alive every 30 seconds
    const keepAlive = setInterval(() => {
      if (!res.destroyed) {
        res.write(': keepalive\n\n');
      } else {
        clearInterval(keepAlive);
        smsProgressService.removeListener('progress', onProgress);
      }
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
    });

  } catch (error) {
    logger.error('Stream SMS progress error:', error);
    if (!res.destroyed) {
      res.status(500).json({
        status: 'error',
        message: 'Server error streaming SMS progress'
      });
    }
  }
};

export const triggerBirthdayNotifications = async (req, res) => {
  try {
    logger.info('Manual birthday notification triggered by user');
    await sendBirthdayNotifications();
    
    res.json({
      status: 'success',
      message: 'Birthday notifications sent successfully'
    });
  } catch (error) {
    logger.error('Manual birthday notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error sending birthday notifications'
    });
  }
};