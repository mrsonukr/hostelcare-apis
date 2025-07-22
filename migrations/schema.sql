DROP TABLE IF EXISTS students;

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
