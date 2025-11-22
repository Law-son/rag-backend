# SMS API Implementation with Arkesel

This document describes the SMS functionality implementation using the Arkesel SMS service.

## Environment Setup

Add the following environment variable to your `.env` file:

## API Endpoints

### 1. Send Manual SMS
**POST** `/api/sms/send`

**Request Body:**
```json
{
  "title": "SMS Title",
  "message": "Your SMS message content",
  "recipients": ["member_id_1", "member_id_2"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "SMS sent to X out of Y recipients",
  "data": {
    "results": [
      {
        "member": "John Doe",
        "phone": "+233123456789",
        "status": "sent",
        "error": null
      }
    ]
  }
}
```

### 2. Send Bulk SMS
**POST** `/api/sms/bulk`

**Request Body:**
```json
{
  "title": "Bulk SMS Title",
  "message": "Your bulk SMS message",
  "filters": {
    "departments": ["dept_id_1", "dept_id_2"],
    "maritalStatus": "Married",
    "baptismStatus": "Baptized",
    "gender": "Male"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Bulk SMS sent to X recipients",
  "data": {
    "recipientCount": 150,
    "success": true
  }
}
```

### 3. Get SMS History
**GET** `/api/sms/history?page=1&limit=10`

**Response:**
```json
{
  "status": "success",
  "data": {
    "smsLogs": [
      {
        "_id": "sms_log_id",
        "title": "SMS Title",
        "message": "SMS content",
        "type": "manual",
        "status": "sent",
        "recipients": [...],
        "sentBy": {...},
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50,
      "limit": 10
    }
  }
}
```

### 4. Get SMS Balance
**GET** `/api/sms/balance`

**Response:**
```json
{
  "status": "success",
  "data": {
    "balance": 25.50,
    "currency": "GHS"
  }
}
```

### 5. Test SMS
**POST** `/api/sms/test`

**Request Body:**
```json
{
  "phoneNumber": "+233123456789"
}
```

### 6. Trigger Birthday Notifications (Manual)
**POST** `/api/sms/birthday`

**Response:**
```json
{
  "status": "success",
  "message": "Birthday notifications sent successfully"
}
```

## Features Implemented

### ✅ Frontend Features
- **Department Filtering**: Multi-select department filtering with "All Members" option
- **Real-time Member Count**: Automatically calculates and displays total members
- **SMS Form**: Title and message fields with 160-character limit validation
- **Character Counter**: Visual indicator with warning when limit exceeded
- **Progress Indicator**: Real-time progress bar during SMS sending
- **SMS History**: Paginated history with recipient status breakdown
- **Responsive Design**: Works on desktop and mobile devices

### ✅ Backend Features
- **Arkesel SMS Integration**: Full integration with Arkesel SMS API
- **Phone Number Formatting**: Automatic formatting for Ghana phone numbers
- **Bulk SMS Support**: Efficient bulk SMS sending with batching
- **SMS Logging**: Complete SMS logs with recipient status tracking
- **Error Handling**: Comprehensive error handling and logging
- **Balance Checking**: SMS balance inquiry functionality
- **Birthday Notifications**: Automatic daily birthday SMS to members
- **Scheduled Tasks**: Cron job for daily birthday checks
- **Development Mode**: Mock SMS in development environment

## SMS Service Architecture

```
Frontend (React) → SMS Service → Arkesel SMS API
                     ↓
                 SMS Logs (MongoDB)
```

## Phone Number Formatting

The system automatically formats phone numbers for the Arkesel API:
- Removes all non-digit characters
- Adds Ghana country code (233) if missing
- Converts local numbers (starting with 0) to international format

Examples:
- `0241234567` → `233241234567`
- `+233241234567` → `233241234567`
- `0241234567` → `233241234567`

## Error Handling

The system handles various error scenarios:
- Invalid phone numbers
- API rate limits
- Network connectivity issues
- Insufficient SMS balance
- Invalid API responses

## Development vs Production

### Development Mode
- Mock SMS sending (no actual SMS sent)
- Logs SMS content to console
- Simulates success responses

### Production Mode
- Real SMS sending via Arkesel API
- Full error handling and logging
- Balance checking and validation

## Birthday Notifications

The system automatically sends birthday SMS to members daily:

### **Automatic Birthday SMS**
- **Schedule**: Runs daily at 8:00 AM (Africa/Lagos timezone)
- **Message**: "Happy Birthday!!! All Nations Redeemers Chapel International wishes you a glorious birthday. God bless you and have a great day. Cheers"
- **Recipients**: All active members with birthdays on the current date
- **Logging**: All birthday SMS are logged with type 'birthday'

### **Manual Birthday Trigger**
- **Endpoint**: `POST /api/sms/birthday`
- **Purpose**: Manually trigger birthday notifications for testing
- **Response**: Success confirmation with count of notifications sent

### **Birthday Detection Logic**
```javascript
// MongoDB query to find members with birthdays today
const members = await Member.find({
  isActive: true,
  $expr: {
    $and: [
      { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] },
      { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] }
    ]
  }
});
```

## Testing

To test the SMS functionality:

1. **Test SMS**: Use the test endpoint to send a single SMS
2. **Check Balance**: Verify SMS balance before sending bulk messages
3. **Send Manual SMS**: Test with a few selected recipients
4. **Send Bulk SMS**: Test with department filters
5. **Test Birthday SMS**: Use the birthday endpoint to trigger birthday notifications
6. **Check History**: Verify SMS logs are created correctly

## Security

- All SMS endpoints require admin authentication
- Input validation on all SMS data
- Rate limiting to prevent abuse
- Comprehensive logging for audit trails

## Monitoring

The system logs:
- SMS send attempts and results
- API errors and responses
- Balance changes
- User actions and timestamps

Check the server logs for detailed SMS activity monitoring.
