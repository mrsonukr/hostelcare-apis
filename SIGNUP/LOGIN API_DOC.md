# Hostel Management System API Documentation

## Overview

The Hostel Management System API is a RESTful service built on Cloudflare Workers that provides endpoints for student registration, authentication, and profile management. The API uses Cloudflare D1 database for data storage and bcrypt for password hashing.

## Base URL

- **Local Development**: `http://127.0.0.1:8787`
- **Production**: `https://hostelapis.mssonutech.workers.dev/`

## Authentication

Currently, the API uses simple password-based authentication. All endpoints are publicly accessible, but login is required to access protected resources.

## Data Models

### Student

```json
{
  "roll_no": "string (8 digits, primary key)",
  "full_name": "string (required)",
  "room_no": "string (required)",
  "hostel_no": "string (required)",
  "profile_pic_url": "string (optional)",
  "email": "string (required, unique)",
  "mobile_no": "string (10 digits, required, unique)",
  "created_at": "datetime (auto-generated)"
}
```

## API Endpoints

### 1. Student Registration

Register a new student in the hostel management system.

**Endpoint**: `POST /api/signup`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "full_name": "John Doe",
  "roll_no": "11232763",
  "room_no": "101",
  "hostel_no": "A",
  "profile_pic_url": "https://example.com/profile.jpg",
  "password": "securepassword123",
  "email": "john.doe@example.com",
  "mobile_no": "9876543210"
}
```

**Field Validations**:
- `roll_no`: Must be exactly 8 digits (e.g., "11232763")
- `mobile_no`: Must be exactly 10 digits (e.g., "9876543210")
- `email`: Must be a valid email format and unique
- `password`: Will be hashed using bcrypt before storage
- `profile_pic_url`: Optional field for profile picture URL

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Student registered successfully",
  "roll_no": "11232763"
}
```

**Error Responses**:

*400 Bad Request - Missing Fields*:
```json
{
  "error": "Missing required fields",
  "required": ["full_name", "roll_no", "room_no", "hostel_no", "password", "email", "mobile_no"]
}
```

*400 Bad Request - Invalid Roll Number*:
```json
{
  "error": "Roll number must be exactly 8 digits",
  "example": "11232763"
}
```

*400 Bad Request - Invalid Mobile Number*:
```json
{
  "error": "Mobile number must be exactly 10 digits",
  "example": "9876543210"
}
```

*409 Conflict - Duplicate Entry*:
```json
{
  "error": "Roll number already exists"
}
```
```json
{
  "error": "Email already exists"
}
```
```json
{
  "error": "Mobile number already exists"
}
```

### 2. Student Login

Authenticate a student using roll number, email, or mobile number.

**Endpoint**: `POST /api/login`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "11232763",
  "password": "securepassword123"
}
```

**Username Options**:
- Roll Number: `"11232763"`
- Email: `"john.doe@example.com"`
- Mobile Number: `"9876543210"`

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "student": {
    "roll_no": "11232763",
    "full_name": "John Doe",
    "room_no": "101",
    "hostel_no": "A",
    "profile_pic_url": "https://example.com/profile.jpg",
    "email": "john.doe@example.com",
    "mobile_no": "9876543210",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:

*400 Bad Request - Missing Credentials*:
```json
{
  "error": "Username and password are required",
  "note": "Username can be roll number, email, or mobile number"
}
```

*401 Unauthorized - Invalid Credentials*:
```json
{
  "error": "Invalid credentials"
}
```

### 3. Get Student Profile

Retrieve student profile information by roll number.

**Endpoint**: `GET /api/student/{roll_no}`

**Path Parameters**:
- `roll_no`: Student's 8-digit roll number (e.g., "11232763")

**Example Request**:
```
GET /api/student/11232763
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "student": {
    "roll_no": "11232763",
    "full_name": "John Doe",
    "room_no": "101",
    "hostel_no": "A",
    "profile_pic_url": "https://example.com/profile.jpg",
    "email": "john.doe@example.com",
    "mobile_no": "9876543210",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:

*400 Bad Request - Invalid Roll Number Format*:
```json
{
  "error": "Invalid roll number format. Must be exactly 8 digits",
  "example": "11232763"
}
```

*404 Not Found - Student Not Found*:
```json
{
  "error": "Student not found"
}
```

## Error Handling

All endpoints return consistent error responses with appropriate HTTP status codes:

- `400 Bad Request`: Invalid input data or missing required fields
- `401 Unauthorized`: Authentication failed
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate entry (unique constraint violation)
- `500 Internal Server Error`: Server-side errors

## CORS Support

The API includes CORS headers to support cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcrypt with a salt rounds of 10
2. **Data Validation**: All inputs are validated before processing
3. **SQL Injection Prevention**: Uses prepared statements to prevent SQL injection
4. **Sensitive Data**: Password hashes are never returned in API responses

## Testing with Postman

### Collection Setup

1. Create a new Postman collection named "Hostel Management API"
2. Set the base URL variable: `{{baseUrl}}` = `http://127.0.0.1:8787`

### Test Scenarios

#### 1. Student Registration Test
```
POST {{baseUrl}}/api/signup
Content-Type: application/json

{
  "full_name": "Test Student",
  "roll_no": "12345678",
  "room_no": "201",
  "hostel_no": "B",
  "profile_pic_url": "https://example.com/test.jpg",
  "password": "testpassword123",
  "email": "test@example.com",
  "mobile_no": "1234567890"
}
```

#### 2. Student Login Test
```
POST {{baseUrl}}/api/login
Content-Type: application/json

{
  "username": "12345678",
  "password": "testpassword123"
}
```

#### 3. Get Student Profile Test
```
GET {{baseUrl}}/api/student/12345678
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS students (
  roll_no TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  room_no TEXT NOT NULL,
  hostel_no TEXT NOT NULL,
  profile_pic_url TEXT,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile_no TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Wrangler CLI
- Cloudflare account

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up D1 database: `wrangler d1 execute hostel --local --file=./schema.sql`
4. Start development server: `npm run dev`
5. API will be available at `http://127.0.0.1:8787`

### Deployment
1. Create D1 database: `wrangler d1 create hostel`
2. Apply schema: `wrangler d1 execute hostel --file=./schema.sql`
3. Deploy worker: `npm run deploy`

## Future Enhancements

1. **JWT Authentication**: Implement JWT tokens for stateless authentication
2. **Role-based Access Control**: Add admin and student roles
3. **Password Reset**: Add forgot password functionality
4. **Profile Updates**: Add endpoints to update student profiles
5. **Hostel Management**: Add endpoints for hostel and room management
6. **File Upload**: Add profile picture upload functionality
7. **Audit Logs**: Track all API operations for security
8. **Rate Limiting**: Implement request rate limiting
9. **API Versioning**: Add version support for backward compatibility

## Support

For issues and questions, please refer to the project repository or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintained by**: Hostel Management System Team