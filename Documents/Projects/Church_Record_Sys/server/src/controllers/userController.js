import User from '../models/User.js';
import logger from '../config/logger.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving users'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || 'data-entry',
      createdBy: req.user._id
    });

    await user.save();

    logger.info(`New user created: ${user.email} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error creating user'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating user'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting user'
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify your own account status'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User status toggled: ${user.email} (${user.isActive ? 'activated' : 'deactivated'}) by ${req.user.email}`);

    res.json({
      status: 'success',
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating user status'
    });
  }
};