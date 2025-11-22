import Member from '../models/Member.js';
import Department from '../models/Department.js';
import logger from '../config/logger.js';

export const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    
    // Add filters
    if (req.query.department) {
      // Support both single department and multiple departments
      if (req.query.department.includes(',')) {
        filter.department = { $in: req.query.department.split(',') };
      } else {
        filter.department = req.query.department;
      }
    }
    if (req.query.maritalStatus) filter.maritalStatus = req.query.maritalStatus;
    if (req.query.baptismStatus) filter.baptismStatus = req.query.baptismStatus;
    if (req.query.gender) filter.gender = req.query.gender;
    
    // Add search filter
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { phoneNumber: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const members = await Member.find(filter)
      .populate('department', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Member.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        members,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    logger.error('Get members error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving members'
    });
  }
};

export const getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('department', 'name description')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Member not found'
      });
    }

    res.json({
      status: 'success',
      data: { member }
    });
  } catch (error) {
    logger.error('Get member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving member'
    });
  }
};

export const createMember = async (req, res) => {
  try {
    // Verify department exists
    const department = await Department.findById(req.body.department);
    if (!department) {
      return res.status(400).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    const member = new Member({
      ...req.body,
      createdBy: req.user._id
    });

    await member.save();
    await member.populate('department', 'name');

    logger.info(`New member created: ${member.fullName} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Member created successfully',
      data: { member }
    });
  } catch (error) {
    logger.error('Create member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating member'
    });
  }
};

export const updateMember = async (req, res) => {
  try {
    // Verify department exists if being updated
    if (req.body.department) {
      const department = await Department.findById(req.body.department);
      if (!department) {
        return res.status(400).json({
          status: 'error',
          message: 'Department not found'
        });
      }
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('department', 'name');

    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Member not found'
      });
    }

    logger.info(`Member updated: ${member.fullName} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Member updated successfully',
      data: { member }
    });
  } catch (error) {
    logger.error('Update member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating member'
    });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user._id },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Member not found'
      });
    }

    logger.info(`Member deactivated: ${member.fullName} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Member deleted successfully'
    });
  } catch (error) {
    logger.error('Delete member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting member'
    });
  }
};

export const searchMembers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const members = await Member.find({
      isActive: true,
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { phoneNumber: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('department', 'name')
    .limit(parseInt(limit))
    .sort({ fullName: 1 });

    res.json({
      status: 'success',
      data: { members }
    });
  } catch (error) {
    logger.error('Search members error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error searching members'
    });
  }
};

export const getMembersByDepartment = async (req, res) => {
  try {
    const members = await Member.find({
      department: req.params.departmentId,
      isActive: true
    })
    .populate('department', 'name')
    .sort({ fullName: 1 });

    res.json({
      status: 'success',
      data: { members }
    });
  } catch (error) {
    logger.error('Get members by department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving members'
    });
  }
};