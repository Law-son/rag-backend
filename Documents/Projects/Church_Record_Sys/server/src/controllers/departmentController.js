import Department from '../models/Department.js';
import Member from '../models/Member.js';
import logger from '../config/logger.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'fullName')
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    // Add member count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const memberCount = await Member.countDocuments({ 
          department: dept._id, 
          isActive: true 
        });
        return {
          ...dept.toObject(),
          memberCount
        };
      })
    );

    res.json({
      status: 'success',
      data: { departments: departmentsWithCount }
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving departments'
    });
  }
};

export const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'fullName phoneNumber')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    // Get member count
    const memberCount = await Member.countDocuments({ 
      department: department._id, 
      isActive: true 
    });

    res.json({
      status: 'success',
      data: { 
        department: {
          ...department.toObject(),
          memberCount
        }
      }
    });
  } catch (error) {
    logger.error('Get department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving department'
    });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const department = new Department({
      ...req.body,
      createdBy: req.user._id
    });

    await department.save();
    await department.populate('head', 'fullName');

    logger.info(`New department created: ${department.name} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Department created successfully',
      data: { department }
    });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating department'
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('head', 'fullName');

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    logger.info(`Department updated: ${department.name} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Department updated successfully',
      data: { department }
    });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating department'
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    // Check if department has members
    const memberCount = await Member.countDocuments({ 
      department: req.params.id, 
      isActive: true 
    });

    if (memberCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete department with ${memberCount} active members. Please reassign members first.`
      });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user._id },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    logger.info(`Department deactivated: ${department.name} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Department deleted successfully'
    });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting department'
    });
  }
};