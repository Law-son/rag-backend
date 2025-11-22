# Church Management System - Backend API

## Overview

RESTful API backend for All Nations Redeemers Chapel International Church Management System built with Node.js, Express, and MongoDB.

## Features

- JWT Authentication with role-based authorization
- Member management with comprehensive profiles
- Department management
- Finance tracking (tithes, offerings, donations)
- SMS notification system with birthday automation
- PDF report generation
- Comprehensive logging and error handling

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **SMS**: Twilio (configurable for other providers)
- **Logging**: Winston
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

## Installation

1. Clone the repository and navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
   - MongoDB connection URI
   - JWT secret key
   - Twilio credentials (for SMS)
   - Other configuration options

5. Start the development server:
```bash
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - Register new user (Admin only)
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update current user profile

#### Members
- `GET /members` - Get all members (with pagination and filters)
- `GET /members/:id` - Get member by ID
- `POST /members` - Create new member
- `PUT /members/:id` - Update member
- `DELETE /members/:id` - Delete member (Admin only)
- `GET /members/search` - Search members
- `GET /members/department/:id` - Get members by department

#### Departments
- `GET /departments` - Get all departments
- `GET /departments/:id` - Get department by ID
- `POST /departments` - Create department (Admin only)
- `PUT /departments/:id` - Update department (Admin only)
- `DELETE /departments/:id` - Delete department (Admin only)

#### Finance
- `GET /finance` - Get finance records (with pagination and filters)
- `POST /finance` - Create finance record
- `PUT /finance/:id` - Update finance record
- `DELETE /finance/:id` - Delete finance record (Admin only)
- `GET /finance/reports` - Get finance reports
- `GET /finance/reports/pdf` - Generate PDF report (Admin only)

#### SMS
- `POST /sms/send` - Send manual SMS (Admin only)
- `POST /sms/bulk` - Send bulk SMS (Admin only)
- `GET /sms/history` - Get SMS history (Admin only)
- `POST /sms/test` - Test SMS configuration (Admin only)

#### Users
- `GET /users` - Get all users (Admin only)
- `POST /users` - Create user (Admin only)
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)
- `PATCH /users/:id/toggle-status` - Toggle user active status (Admin only)

#### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

## Database Schema

### Models

1. **User**: System users with role-based permissions
2. **Member**: Church members with detailed profiles
3. **Department**: Church departments for member organization
4. **FinanceRecord**: Financial transactions (tithes, offerings, donations)
5. **SmsLog**: SMS communication history

### Indexes

Optimized indexes for performance on frequently queried fields:
- Member names (text search)
- Department references
- Date ranges for finance and birthday queries
- User authentication

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token authentication with expiration
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- CORS protection
- Security headers with Helmet
- Error handling without sensitive information exposure

## SMS Integration

### Supported Providers
- **Twilio** (Primary)
- **Africa's Talking** (Configurable)
- **Development Mock** (Testing)

### Birthday Automation
- Daily scheduled job at 8:00 AM
- Automatically finds members with birthdays
- Sends personalized birthday messages
- Logs all SMS activity

## Logging

Winston logging with different levels:
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output**: Development mode only

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/church_management
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
FRONTEND_URL=http://localhost:5173
```

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (Jest)

## Production Considerations

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use MongoDB Atlas or managed MongoDB
3. **Security**: Use strong JWT secrets and HTTPS
4. **Monitoring**: Implement application monitoring
5. **Backup**: Regular database backups
6. **SMS**: Configure production SMS provider credentials

## Error Handling

Centralized error handling with:
- MongoDB validation errors
- JWT authentication errors
- Custom application errors
- Request validation errors
- Development stack traces (disabled in production)

## Rate Limiting

API endpoints are rate-limited:
- 100 requests per 15-minute window per IP
- Configurable in production environment

For detailed API documentation, see [APIDOCS.md](./APIDOCS.md).