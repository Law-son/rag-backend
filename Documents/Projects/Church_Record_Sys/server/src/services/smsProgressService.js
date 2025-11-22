import { EventEmitter } from 'events';

class SMSProgressService extends EventEmitter {
  constructor() {
    super();
    this.activeProgress = new Map(); // Map to store active SMS progress by session ID
  }

  /**
   * Start tracking SMS progress
   * @param {string} sessionId - Unique session ID for this SMS batch
   * @param {number} totalRecipients - Total number of recipients
   * @param {string} title - SMS title
   * @param {string} message - SMS message
   */
  startProgress(sessionId, totalRecipients, title, message) {
    const progress = {
      sessionId,
      title,
      message,
      totalRecipients,
      sent: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(totalRecipients / 100), // 100 recipients per batch
      isComplete: false,
      startTime: new Date(),
      endTime: null,
      batches: [] // Store results for each batch
    };

    this.activeProgress.set(sessionId, progress);
    this.emit('progress', sessionId, progress);
    return progress;
  }

  /**
   * Update progress for a batch
   * @param {string} sessionId - Session ID
   * @param {number} batchIndex - Current batch index (0-based)
   * @param {number} batchSent - Number of SMS sent in this batch
   * @param {number} batchFailed - Number of SMS failed in this batch
   * @param {Object} batchResults - Detailed results for this batch
   */
  updateBatchProgress(sessionId, batchIndex, batchSent, batchFailed, batchResults = []) {
    const progress = this.activeProgress.get(sessionId);
    if (!progress) {
      return;
    }

    progress.currentBatch = batchIndex + 1;
    progress.sent += batchSent;
    progress.failed += batchFailed;
    progress.batches[batchIndex] = {
      index: batchIndex,
      sent: batchSent,
      failed: batchFailed,
      results: batchResults
    };

    // Check if all batches are complete
    if (progress.currentBatch >= progress.totalBatches) {
      progress.isComplete = true;
      progress.endTime = new Date();
      progress.duration = progress.endTime - progress.startTime;
    }

    this.activeProgress.set(sessionId, progress);
    this.emit('progress', sessionId, progress);

    // Clean up completed progress after 5 minutes
    if (progress.isComplete) {
      setTimeout(() => {
        this.activeProgress.delete(sessionId);
      }, 5 * 60 * 1000);
    }

    return progress;
  }

  /**
   * Get current progress for a session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Progress object or null if not found
   */
  getProgress(sessionId) {
    return this.activeProgress.get(sessionId) || null;
  }

  /**
   * Get all active progress sessions
   * @returns {Array} Array of active progress objects
   */
  getAllActiveProgress() {
    return Array.from(this.activeProgress.values());
  }

  /**
   * Cancel progress tracking for a session
   * @param {string} sessionId - Session ID
   */
  cancelProgress(sessionId) {
    const progress = this.activeProgress.get(sessionId);
    if (progress) {
      progress.isComplete = true;
      progress.endTime = new Date();
      progress.cancelled = true;
      this.activeProgress.delete(sessionId);
      this.emit('progress', sessionId, progress);
    }
  }

  /**
   * Create a session ID
   * @returns {string} Unique session ID
   */
  createSessionId() {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create a singleton instance
const smsProgressService = new SMSProgressService();

export default smsProgressService;
