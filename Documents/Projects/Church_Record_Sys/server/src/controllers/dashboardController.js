import Member from '../models/Member.js';
import Department from '../models/Department.js';
import FinanceRecord from '../models/FinanceRecord.js';
import logger from '../config/logger.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get basic counts
    const [
      totalMembers,
      totalDepartments,
      monthlyFinanceRecords,
      yearlyFinanceRecords
    ] = await Promise.all([
      Member.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      FinanceRecord.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      FinanceRecord.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    // Process finance data
    const monthlyFinance = {
      tithe: monthlyFinanceRecords.find(r => r._id === 'Tithe')?.total || 0,
      offering: monthlyFinanceRecords.find(r => r._id === 'Offering')?.total || 0,
      donation: monthlyFinanceRecords.find(r => r._id === 'Donation')?.total || 0
    };
    monthlyFinance.total = monthlyFinance.tithe + monthlyFinance.offering + monthlyFinance.donation;

    const yearlyFinance = {
      tithe: yearlyFinanceRecords.find(r => r._id === 'Tithe')?.total || 0,
      offering: yearlyFinanceRecords.find(r => r._id === 'Offering')?.total || 0,
      donation: yearlyFinanceRecords.find(r => r._id === 'Donation')?.total || 0
    };
    yearlyFinance.total = yearlyFinance.tithe + yearlyFinance.offering + yearlyFinance.donation;

    // Get upcoming birthdays (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const upcomingBirthdays = await Member.aggregate([
      { $match: { isActive: true } },
      {
        $addFields: {
          birthdayThisYear: {
            $dateFromParts: {
              year: now.getFullYear(),
              month: { $month: '$dateOfBirth' },
              day: { $dayOfMonth: '$dateOfBirth' }
            }
          }
        }
      },
      {
        $match: {
          birthdayThisYear: {
            $gte: now,
            $lte: nextWeek
          }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $project: {
          fullName: 1,
          dateOfBirth: 1,
          birthdayThisYear: 1,
          department: { $arrayElemAt: ['$department.name', 0] }
        }
      },
      { $sort: { birthdayThisYear: 1 } },
      { $limit: 10 }
    ]);

    // Get recent members (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const recentMembers = await Member.find({
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('department', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('fullName createdAt department');

    // Get member distribution by department
    const membersByDepartment = await Member.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$department.name', 0] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      status: 'success',
      data: {
        overview: {
          totalMembers,
          totalDepartments,
          monthlyIncome: monthlyFinance.total,
          yearlyIncome: yearlyFinance.total
        },
        finance: {
          monthly: monthlyFinance,
          yearly: yearlyFinance
        },
        upcomingBirthdays,
        recentMembers,
        membersByDepartment
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving dashboard stats'
    });
  }
};