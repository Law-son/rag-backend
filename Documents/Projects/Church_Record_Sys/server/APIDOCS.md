# Church Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this format:
```json
{
  "status": "success" | "error",
  "message": "Descriptive message",
  "data": {
    // Response data
  }
}
```

## Error Responses

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Validation errors (if applicable)
  ]
}
```

## Endpoints

### Authentication

#### POST /auth/login
Login user and return JWT token.

**Request Body:**
```json
{
  "email": "admin@church.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "admin@church.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "fullName": "John Doe"
    }
  }
}
```

#### POST /auth/register
Register new user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "email": "newuser@church.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "data-entry"
}
```

#### GET /auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

#### PUT /auth/profile
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Updated First",
  "lastName": "Updated Last"
}
```

### Members

#### GET /members
Get paginated list of members with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Records per page (default: 20)
- `department` (string): Filter by department ID
- `maritalStatus` (string): Filter by marital status
- `baptismStatus` (string): Filter by baptism status
- `gender` (string): Filter by gender

**Response:**
```json
{
  "status": "success",
  "data": {
    "members": [
      {
        "_id": "member_id",
        "fullName": "John Doe",
        "gender": "Male",
        "dateOfBirth": "1990-01-15",
        "location": "Lagos, Nigeria",
        "department": {
          "_id": "dept_id",
          "name": "Youth Ministry"
        },
        "phoneNumber": "+234800123456",
        "maritalStatus": "Single",
        "occupation": "Software Engineer",
        "emergencyContact": {
          "name": "Jane Doe",
          "phone": "+234800654321",
          "relationship": "Sister"
        },
        "baptismStatus": "Baptized",
        "joinDate": "2023-01-01",
        "age": 34,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 100,
      "limit": 20
    }
  }
}
```

#### GET /members/:id
Get member by ID.

**Headers:** `Authorization: Bearer <token>`

#### POST /members
Create new member.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "gender": "Male",
  "dateOfBirth": "1990-01-15",
  "location": "Lagos, Nigeria",
  "department": "department_id",
  "phoneNumber": "+234800123456",
  "maritalStatus": "Single",
  "occupation": "Software Engineer",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+234800654321",
    "relationship": "Sister"
  },
  "baptismStatus": "Baptized",
  "notes": "Optional notes"
}
```

#### PUT /members/:id
Update member.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST /members

#### DELETE /members/:id
Delete (deactivate) member (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### GET /members/search
Search members by name, phone, or location.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (string): Search query (minimum 2 characters)
- `limit` (integer): Maximum results (default: 10)

#### GET /members/department/:departmentId
Get all members in a specific department.

**Headers:** `Authorization: Bearer <token>`

### Departments

#### GET /departments
Get all active departments.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "data": {
    "departments": [
      {
        "_id": "dept_id",
        "name": "Youth Ministry",
        "description": "Ministry for young adults",
        "head": {
          "_id": "member_id",
          "fullName": "John Doe"
        },
        "memberCount": 25,
        "isActive": true,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### POST /departments
Create new department (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Children's Ministry",
  "description": "Ministry for children ages 5-12",
  "head": "member_id"
}
```

#### PUT /departments/:id
Update department (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### DELETE /departments/:id
Delete department (Admin only). Cannot delete departments with active members.

**Headers:** `Authorization: Bearer <admin_token>`

### Finance

#### GET /finance
Get paginated finance records with filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Filter by type (Tithe, Offering, Donation)
- `member`: Filter by member ID
- `startDate`, `endDate`: Date range filter (YYYY-MM-DD)

**Response:**
```json
{
  "status": "success",
  "data": {
    "records": [
      {
        "_id": "record_id",
        "amount": 50000,
        "type": "Tithe",
        "date": "2023-12-01",
        "description": "Monthly tithe",
        "member": {
          "_id": "member_id",
          "fullName": "John Doe"
        },
        "paymentMethod": "Bank Transfer",
        "receiptNumber": "RCP000001",
        "createdAt": "2023-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 50,
      "limit": 20
    }
  }
}
```

#### POST /finance
Create finance record.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 50000,
  "type": "Tithe",
  "date": "2023-12-01",
  "description": "Monthly tithe",
  "member": "member_id",
  "donorName": "Anonymous Donor",
  "paymentMethod": "Cash"
}
```

#### GET /finance/reports
Get aggregated finance reports (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `startDate`, `endDate`: Date range
- `groupBy`: Grouping (month, week, day)

**Response:**
```json
{
  "status": "success",
  "data": {
    "reports": [
      {
        "_id": {
          "year": 2023,
          "month": 12
        },
        "titheAmount": 500000,
        "offeringAmount": 200000,
        "donationAmount": 100000,
        "totalAmount": 800000,
        "totalRecords": 45
      }
    ],
    "summary": {
      "tithe": {
        "amount": 2000000,
        "count": 120
      },
      "offering": {
        "amount": 800000,
        "count": 80
      },
      "donation": {
        "amount": 300000,
        "count": 25
      },
      "total": {
        "amount": 3100000,
        "count": 225
      }
    }
  }
}
```

#### GET /finance/reports/pdf
Generate and download PDF report (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:** Same as GET /finance/reports

**Response:** PDF file download

### SMS

#### POST /sms/send
Send manual SMS to selected members (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "message": "Church service at 10 AM this Sunday. God bless!",
  "recipients": ["member_id1", "member_id2"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "SMS sent to 2 out of 2 recipients",
  "data": {
    "results": [
      {
        "member": "John Doe",
        "phone": "+234800123456",
        "status": "sent",
        "error": null
      }
    ]
  }
}
```

#### POST /sms/bulk
Send bulk SMS based on filters (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "message": "Important church announcement",
  "filters": {
    "departments": ["dept_id1", "dept_id2"],
    "maritalStatus": "Single",
    "baptismStatus": "Baptized",
    "gender": "Male"
  }
}
```

#### GET /sms/history
Get SMS sending history (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Filter by SMS type
- `status`: Filter by status

### Users

#### GET /users
Get all users (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### POST /users
Create new user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:** Same as POST /auth/register

#### PUT /users/:id
Update user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### DELETE /users/:id
Delete user (Admin only). Cannot delete own account.

**Headers:** `Authorization: Bearer <admin_token>`

#### PATCH /users/:id/toggle-status
Toggle user active/inactive status (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### Dashboard

#### GET /dashboard/stats
Get dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalMembers": 250,
      "totalDepartments": 8,
      "monthlyIncome": 1500000,
      "yearlyIncome": 15000000
    },
    "finance": {
      "monthly": {
        "tithe": 800000,
        "offering": 500000,
        "donation": 200000,
        "total": 1500000
      },
      "yearly": {
        "tithe": 8000000,
        "offering": 5000000,
        "donation": 2000000,
        "total": 15000000
      }
    },
    "upcomingBirthdays": [
      {
        "_id": "member_id",
        "fullName": "John Doe",
        "dateOfBirth": "1990-01-15",
        "birthdayThisYear": "2024-01-15",
        "department": "Youth Ministry"
      }
    ],
    "recentMembers": [
      {
        "_id": "member_id",
        "fullName": "Jane Smith",
        "createdAt": "2023-12-01T00:00:00.000Z",
        "department": {
          "name": "Adult Ministry"
        }
      }
    ],
    "membersByDepartment": [
      {
        "_id": "dept_id",
        "name": "Youth Ministry",
        "count": 45
      }
    ]
  }
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

All API endpoints are rate-limited to 100 requests per 15-minute window per IP address.

## Data Validation

All inputs are validated on the server side. Validation errors are returned in the following format:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```