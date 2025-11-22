# Church Record Management System
## All Nations Redeemers Chapel International

A comprehensive web-based church management system built with React and Node.js.

## Project Structure

```
├── client/          # ReactJS Frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Node.js Backend API
│   ├── src/
│   ├── config/
│   └── package.json
└── README.md
```

## Features

- **Member Management**: Complete CRUD operations with detailed profiles
- **Department Management**: Organize members by departments
- **Finance Module**: Track tithes, offerings, donations with reporting
- **Role-Based Access Control**: Admin and Data Entry user roles
- **SMS Notifications**: Manual and automatic birthday notifications
- **Responsive Dashboard**: Modern UI works on desktop and mobile

## Quick Start

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure your MongoDB URL and other settings in .env
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## Documentation

- [API Documentation](server/APIDOCS.md)
- [Frontend Documentation](client/README.md)
- [Backend Documentation](server/README.md)

## Production Deployment

Both frontend and backend are production-ready with proper security, validation, and error handling.