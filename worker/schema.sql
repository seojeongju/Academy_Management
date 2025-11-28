DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Trainees;
DROP TABLE IF EXISTS Consultations;

CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'teacher',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Trainees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trainee_number TEXT UNIQUE,
    trainee_type TEXT NOT NULL, -- 'employed', 'job_seeker'
    course_name TEXT,
    phone TEXT,
    email TEXT,
    birth_date DATE,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'dropped'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainee_id INTEGER NOT NULL,
    counselor_id INTEGER,
    consult_date DATETIME NOT NULL,
    consultation_phase TEXT, -- 'pre_admission', 'during_training', 'post_training', 'employment'
    category TEXT NOT NULL,
    contact_method TEXT,
    importance INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    action_taken TEXT,
    next_follow_up_date DATE,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainee_id) REFERENCES Trainees(id),
    FOREIGN KEY (counselor_id) REFERENCES Users(id)
);

-- 초기 관리자 계정 (비번: admin123 - 실제로는 해시화 필요하지만 데모용 평문 저장 혹은 클라이언트 해싱 가정)
-- 여기서는 간단히 텍스트로 저장 (보안 취약하지만 마이그레이션 데모용)
INSERT INTO Users (username, password, name, role) VALUES ('admin', 'admin123', '관리자', 'admin');
