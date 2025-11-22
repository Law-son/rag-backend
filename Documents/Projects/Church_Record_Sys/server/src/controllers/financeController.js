import FinanceRecord from '../models/FinanceRecord.js';
import Member from '../models/Member.js';
import logger from '../config/logger.js';
import PDFDocument from 'pdfkit';

export const getFinanceRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Add filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.member) filter.member = req.query.member;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    
    // Add search filter
    if (req.query.search) {
      filter.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { donorName: { $regex: req.query.search, $options: 'i' } },
        { receiptNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const records = await FinanceRecord.find(filter)
      .populate('member', 'fullName')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FinanceRecord.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        records,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    logger.error('Get finance records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving finance records'
    });
  }
};

export const createFinanceRecord = async (req, res) => {
  try {
    // Verify member exists if provided
    if (req.body.member) {
      const member = await Member.findById(req.body.member);
      if (!member) {
        return res.status(400).json({
          status: 'error',
          message: 'Member not found'
        });
      }
    }

    const record = new FinanceRecord({
      ...req.body,
      createdBy: req.user._id
    });

    await record.save();
    await record.populate('member', 'fullName');

    logger.info(`New finance record created: ${record.type} - ${record.amount} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Finance record created successfully',
      data: { record }
    });
  } catch (error) {
    logger.error('Create finance record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating finance record'
    });
  }
};

export const updateFinanceRecord = async (req, res) => {
  try {
    // Verify member exists if being updated
    if (req.body.member) {
      const member = await Member.findById(req.body.member);
      if (!member) {
        return res.status(400).json({
          status: 'error',
          message: 'Member not found'
        });
      }
    }

    const record = await FinanceRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('member', 'fullName');

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Finance record not found'
      });
    }

    logger.info(`Finance record updated: ${record.receiptNumber} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Finance record updated successfully',
      data: { record }
    });
  } catch (error) {
    logger.error('Update finance record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating finance record'
    });
  }
};

export const deleteFinanceRecord = async (req, res) => {
  try {
    const record = await FinanceRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Finance record not found'
      });
    }

    logger.info(`Finance record deleted: ${record.receiptNumber} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Finance record deleted successfully'
    });
  } catch (error) {
    logger.error('Delete finance record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting finance record'
    });
  }
};

export const getFinanceReports = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // Aggregate by type and period
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            type: '$type',
            year: { $year: '$date' },
            month: groupBy === 'month' ? { $month: '$date' } : null,
            week: groupBy === 'week' ? { $week: '$date' } : null,
            day: groupBy === 'day' ? { $dayOfMonth: '$date' } : null
          },
          totalAmount: { $sum: '$amount' },
          recordCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            week: '$_id.week',
            day: '$_id.day'
          },
          titheAmount: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'Tithe'] }, '$totalAmount', 0] }
          },
          offeringAmount: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'Offering'] }, '$totalAmount', 0] }
          },
          donationAmount: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'Donation'] }, '$totalAmount', 0] }
          },
          totalAmount: { $sum: '$totalAmount' },
          totalRecords: { $sum: '$recordCount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1, '_id.day': -1 } }
    ];

    const reports = await FinanceRecord.aggregate(pipeline);

    // Get overall totals
    const totalPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          recordCount: { $sum: 1 }
        }
      }
    ];

    const totals = await FinanceRecord.aggregate(totalPipeline);
    const totalsByType = totals.reduce((acc, curr) => {
      acc[curr._id.toLowerCase()] = {
        amount: curr.totalAmount,
        count: curr.recordCount
      };
      return acc;
    }, {});

    const overallTotal = totals.reduce((sum, curr) => sum + curr.totalAmount, 0);

    res.json({
      status: 'success',
      data: {
        reports,
        summary: {
          tithe: totalsByType.tithe || { amount: 0, count: 0 },
          offering: totalsByType.offering || { amount: 0, count: 0 },
          donation: totalsByType.donation || { amount: 0, count: 0 },
          total: {
            amount: overallTotal,
            count: totals.reduce((sum, curr) => sum + curr.recordCount, 0)
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get finance reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error generating finance reports'
    });
  }
};

export const generatePDFReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (type) filter.type = type;

    const records = await FinanceRecord.find(filter)
      .populate('member', 'fullName')
      .sort({ date: -1 });

    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);

    // Create PDF
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=finance-report-${Date.now()}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('All Nations Redeemers Chapel International', { align: 'center' });
    doc.fontSize(16).text('Finance Report', { align: 'center' });
    doc.moveDown();

    // Report details
    doc.fontSize(12);
    if (startDate) doc.text(`From: ${new Date(startDate).toDateString()}`);
    if (endDate) doc.text(`To: ${new Date(endDate).toDateString()}`);
    if (type) doc.text(`Type: ${type}`);
    doc.text(`Generated: ${new Date().toDateString()}`);
    doc.text(`Total Records: ${records.length}`);
    doc.text(`Total Amount: ₦${totalAmount.toLocaleString()}`);
    doc.moveDown();

    // Table header
    doc.text('Date', 50, doc.y);
    doc.text('Type', 120, doc.y);
    doc.text('Amount', 200, doc.y);
    doc.text('Member/Donor', 280, doc.y);
    doc.text('Receipt', 400, doc.y);
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    records.forEach(record => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
      }
      
      doc.text(record.date.toDateString(), 50, doc.y);
      doc.text(record.type, 120, doc.y);
      doc.text(`₦${record.amount.toLocaleString()}`, 200, doc.y);
      doc.text(record.member?.fullName || record.donorName || 'Anonymous', 280, doc.y);
      doc.text(record.receiptNumber || '-', 400, doc.y);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    logger.error('Generate PDF report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error generating PDF report'
    });
  }
};