DROP TABLE IF EXISTS students;

CREATE TABLE IF NOT EXISTS students (
  roll_no TEXT PRIMARY KEY,
  full_name TEXT,
  room_no TEXT,
  hostel_no TEXT,
  profile_pic_url TEXT,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  mobile_no TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);