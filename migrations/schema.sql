DROP TABLE IF EXISTS students;

CREATE TABLE students (
    roll_no TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile_no TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    gender TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    room_no TEXT,
    hostel_no TEXT,
    profile_pic_url TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
