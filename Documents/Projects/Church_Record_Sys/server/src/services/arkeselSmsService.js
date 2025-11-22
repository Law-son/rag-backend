import axios from 'axios';
import { formatNumber } from '../utils/formatNumber.js';
import logger from '../config/logger.js';

const apiKey = process.env.ARKESEL_API_KEY;

class ArkeselSMSService {
  /**
   * Send SMS using Arkesel API
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @param {string} senderId - Sender ID (default: "ANRCI")
   * @returns {Object} - SMS send result
   */
  static async sendSMS(phoneNumber, message, senderId = 'ANRCI') {
    try {
      const formattedNumber = formatNumber(phoneNumber);
      
      // Arkesel SMS API endpoint
      const apiUrl = 'https://sms.arkesel.com/sms/api';
      
      const params = {
        action: 'send-sms',
        api_key: apiKey,
        to: formattedNumber,
        from: senderId,
        sms: message
      };

      logger.info(`Sending SMS to ${formattedNumber} via Arkesel`);
      
      const response = await axios.get(apiUrl, { params });
      
      logger.info('Arkesel SMS response:', response.data);
      
      // Check if SMS was sent successfully
      if (response.data && response.data.code === 'ok') {
        return {
          success: true,
          messageId: response.data.bulk_id || `arkesel_${Date.now()}`,
          provider: 'arkesel',
          cost: response.data.amount || 0,
          balance: response.data.balance || 0
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Unknown error from Arkesel API',
          provider: 'arkesel'
        };
      }
    } catch (error) {
      logger.error('Arkesel SMS error:', error);
      
      // Handle specific error cases
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.statusText;
        return {
          success: false,
          error: `Arkesel API error: ${errorMessage}`,
          provider: 'arkesel'
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Network error: Unable to reach Arkesel API',
          provider: 'arkesel'
        };
      } else {
        return {
          success: false,
          error: `SMS service error: ${error.message}`,
          provider: 'arkesel'
        };
      }
    }
  }

  /**
   * Send bulk SMS using Arkesel API
   * @param {Array<string>} phoneNumbers - Array of recipient phone numbers
   * @param {string} message - SMS message content
   * @param {string} senderId - Sender ID (default: "Church")
   * @returns {Object} - Bulk SMS send result
   */
  static async sendBulkSMS(phoneNumbers, message, senderId = 'Church') {
    try {
      const results = [];
      const batchSize = 100; // Arkesel supports up to 100 recipients per request
      
      // Process in batches
      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        const formattedNumbers = batch.map(formatNumber);
        
        const apiUrl = 'https://sms.arkesel.com/sms/api';
        
        const params = {
          action: 'send-sms',
          api_key: apiKey,
          to: formattedNumbers.join(','),
          from: senderId,
          sms: message
        };

        logger.info(`Sending bulk SMS to ${formattedNumbers.length} recipients via Arkesel`);
        
        try {
          const response = await axios.get(apiUrl, { params });
          
          if (response.data && response.data.code === 'ok') {
            // All SMS in batch sent successfully
            batch.forEach(phoneNumber => {
              results.push({
                phoneNumber,
                success: true,
                messageId: response.data.bulk_id || `arkesel_${Date.now()}`,
                provider: 'arkesel'
              });
            });
          } else {
            // Batch failed
            batch.forEach(phoneNumber => {
              results.push({
                phoneNumber,
                success: false,
                error: response.data.message || 'Unknown error from Arkesel API',
                provider: 'arkesel'
              });
            });
          }
        } catch (batchError) {
          logger.error('Arkesel bulk SMS batch error:', batchError);
          
          // Mark all SMS in batch as failed
          batch.forEach(phoneNumber => {
            results.push({
              phoneNumber,
              success: false,
              error: batchError.message,
              provider: 'arkesel'
            });
          });
        }
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < phoneNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;
      
      return {
        success: successCount > 0,
        totalSent: successCount,
        totalFailed: failedCount,
        results
      };
    } catch (error) {
      logger.error('Arkesel bulk SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get SMS delivery status
   * @param {string} messageId - SMS message ID
   * @returns {Object} - Delivery status
   */
  static async getDeliveryStatus(messageId) {
    try {
      const apiUrl = 'https://sms.arkesel.com/sms/api';
      
      const params = {
        action: 'delivery-status',
        api_key: apiKey,
        bulk_id: messageId
      };

      const response = await axios.get(apiUrl, { params });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Arkesel delivery status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account balance
   * @returns {Object} - Account balance information
   */
  static async getBalance() {
    try {
      const apiUrl = 'https://sms.arkesel.com/sms/api';
      
      const params = {
        action: 'check-balance',
        api_key: apiKey
      };

      const response = await axios.get(apiUrl, { params });
      
      return {
        success: true,
        balance: response.data.balance || 0,
        currency: response.data.currency || 'GHS'
      };
    } catch (error) {
      logger.error('Arkesel balance check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ArkeselSMSService;
