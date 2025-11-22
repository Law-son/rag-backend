import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validateMember = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('gender')
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be either Male or Female'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required')
    .custom(value => {
      const today = new Date();
      const birthDate = new Date(value);
      if (birthDate >= today) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),
  
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isMongoId()
    .withMessage('Invalid department ID'),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Invalid phone number format'),
  
  body('maritalStatus')
    .isIn(['Single', 'Married', 'Divorced', 'Widowed'])
    .withMessage('Invalid marital status'),
  
  body('baptismStatus')
    .isIn(['Baptized', 'Not Baptized', 'Planning to be Baptized'])
    .withMessage('Invalid baptism status'),
  
  body('emergencyContact.name')
    .notEmpty()
    .withMessage('Emergency contact name is required'),
  
  body('emergencyContact.phone')
    .notEmpty()
    .withMessage('Emergency contact phone is required')
    .matches(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Invalid emergency contact phone format'),
  
  body('emergencyContact.relationship')
    .notEmpty()
    .withMessage('Emergency contact relationship is required')
];

export const validateDepartment = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

export const validateFinanceRecord = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('type')
    .notEmpty()
    .withMessage('Finance record type is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Type must be between 1 and 50 characters'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('paymentMethod')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment method must be between 1 and 50 characters'),
  
  body('member')
    .optional()
    .isMongoId()
    .withMessage('Invalid member ID'),
  
  body('donorName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Donor name must not exceed 100 characters')
];

export const validateUser = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'data-entry'])
    .withMessage('Invalid role')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];