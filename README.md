# Smart Exam Hall Seating System - Backend Server

## Features
- JWT-based authentication for Admin, Teacher, and Student roles
- Excel file upload for bulk student data import
- Automatic seat allocation algorithm
- QR code generation for student verification
- Real-time verification system for invigilators
- MongoDB database with Mongoose ODM

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string and JWT secret.

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin/teacher
- `POST /api/auth/login` - Login admin/teacher
- `POST /api/auth/student-login` - Student login (roll number + DOB)
- `GET /api/auth/me` - Get current user

### Students
- `POST /api/students/upload` - Upload students via Excel (Admin only)
- `GET /api/students` - Get all students
- `GET /api/students/unassigned` - Get unassigned students
- `GET /api/students/:id` - Get student by ID
- `DELETE /api/students/:id` - Delete student (Admin only)

### Rooms
- `POST /api/rooms` - Create exam room (Admin only)
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms/allocate` - Allocate seats to students (Admin only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

### Verification
- `POST /api/verification/verify` - Verify student QR code (Admin/Teacher)
- `GET /api/verification/stats` - Get verification statistics
- `PUT /api/verification/reset/:studentId` - Reset verification status (Admin only)

## Excel File Format

The Excel file for student upload should have the following columns:
- `rollNumber` - Student roll number (required)
- `name` - Student name (required)
- `class` - Student class/section (required)
- `dob` - Date of birth (required)
- `examName` - Name of the exam (required)
- `examDate` - Date of the exam (required)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `NODE_ENV` - Environment (development/production)

## Deployment

### Deploy to Render/Railway:
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### MongoDB Atlas Setup:
1. Create account at mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to MONGODB_URI in .env
