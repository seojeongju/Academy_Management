<<<<<<< HEAD
# HRD 직업훈련기관 통합 관리 시스템

## 📋 프로젝트 개요

**HRD-LMS & CRM 통합 시스템**입니다. 국비지원(내일배움카드) 및 일반 직무 교육을 운영하는 HRD 센터의 복잡한 행정 업무를 자동화하며, 특히 **온라인 평가 시스템(CBT)**을 통해 평가 근거 자료 관리의 효율성을 높입니다.

## 🎯 핵심 목표

- **행정 효율화**: HRD-Net 행정 업무와 내부 데이터 일원화
- **평가 자동화**: 시험 출제부터 채점, 결과 리포트 생성까지 원스톱 처리
- **취업률 제고**: 구직자 과정 훈련생의 체계적인 취업 상담 및 알선 이력 관리

## 🛠️ 기술 스택

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (개발) / PostgreSQL (프로덕션)
- **ORM**: Sequelize
- **Authentication**: JWT
- **External API**: 카카오 알림톡 (예정)

### Frontend
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS
- **Dev Server**: Vite
- **Deploy**: Cloudflare Pages (예정)

## ⭐ 핵심 기능

### 1. 훈련생 관리 (Trainee Management)
- ✅ 재직자/구직자 구분 관리
- ✅ HRD-Net 연동 정보 (카드 발급, 자비 부담금)
- ✅ 디지털 서류 보관
- ✅ 취업 상태 추적

### 2. 단계별 상담 관리 (CRM)
- ✅ 입학 상담 (선발 평가)
- ✅ 훈련 중 상담 (고충, 출결)
- ✅ 취업 상담 (알선, 이력서 첨삭)
- ✅ 사후 관리 (해피콜)

### 3. 🆕 온라인 시험 시스템 (CBT) - 핵심 신규 기능
#### 문제은행 관리
- ✅ 다양한 문제 유형 (객관식, 복수선택, 단답형, 서술형, OX)
- ✅ NCS 능력단위 매핑
- ✅ 난이도 및 태그 관리
- ✅ 이미지/수식 지원

#### 시험 출제
- ✅ 문제은행에서 문제 선택/랜덤 추출
- ✅ 배점 및 제한 시간 설정
- ✅ 응시 기간 설정
- ✅ 부정 방지 옵션 (문제 순서 섞기, 브라우저 이탈 감지)

#### 시험 응시
- ✅ 실시간 타이머
- ✅ 답안 자동 임시 저장
- ✅ 부정행위 감지

#### 채점 및 결과
- ✅ 객관식 자동 채점
- ✅ 주관식 수동 채점
- ✅ 문항별 정오답 해설
- ✅ 통계 및 리포트 생성

### 4. 취업 지원 시스템
- ✅ 취업 정보 관리
- ✅ 알선 이력 추적
- ✅ 이력서 첨삭 관리
- ✅ 재직 증명 서류 업로드

### 5. 출결 관리 (예정)
- ⏳ 다양한 입실 방식 (QR, 비콘, 지문)
- ⏳ 공결 처리 워크플로우
- ⏳ HRD-Net 연동 출석부 PDF

## 📁 프로젝트 구조

```
Academy_Management/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, 환경 설정
│   │   ├── controllers/     # 비즈니스 로직
│   │   │   ├── authController.js
│   │   │   ├── studentController.js (→ traineeController.js)
│   │   │   ├── consultationController.js
│   │   │   ├── examQuestionController.js  # 🆕 문제은행
│   │   │   └── examController.js          # 🆕 시험 관리
│   │   ├── middleware/      # 인증, 에러 핸들링
│   │   ├── models/          # Sequelize 모델
│   │   │   ├── User.js
│   │   │   ├── Trainee.js              # 🆕 학생→훈련생
│   │   │   ├── Consultation.js         # 업그레이드
│   │   │   ├── Course.js
│   │   │   ├── Enrollment.js
│   │   │   ├── ExamQuestion.js         # 🆕 문제은행
│   │   │   ├── Exam.js                 # 🆕 시험
│   │   │   ├── ExamSubmission.js       # 🆕 응시 이력
│   │   │   └── Employment.js           # 🆕 취업 관리
│   │   ├── routes/          # API 라우트
│   │   └── index.js
│   └── database.sqlite
│
└── frontend/
    ├── src/
    │   ├── services/
    │   ├── styles/
    │   └── main.js
    └── index.html
```

## 🚀 시작하기

### 1. 백엔드 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 설정
npm run dev
```

### 2. 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

### 3. 초기 데이터 생성

```bash
cd backend
node src/scripts/seed.js
```

## 🔐 테스트 계정

```
관리자 (Admin):
- username: admin
- password: admin123

강사 (Teacher):
- username: teacher
- password: teacher123
```

## 📊 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보

### 훈련생 관리
- `GET /api/students` - 훈련생 목록
- `POST /api/students` - 훈련생 등록
- `GET /api/students/:id` - 훈련생 상세
- `PUT /api/students/:id` - 훈련생 수정

### 상담 관리
- `GET /api/consultations` - 상담 목록
- `POST /api/consultations` - 상담 등록
- `GET /api/consultations/today` - 오늘 예정 상담
- `GET /api/consultations/upcoming/follow-ups` - 예정된 재상담

### 🆕 문제은행 (CBT)
- `GET /api/exam-questions` - 문제 목록
- `POST /api/exam-questions` - 문제 등록
- `PUT /api/exam-questions/:id` - 문제 수정
- `DELETE /api/exam-questions/:id` - 문제 삭제
- `GET /api/exam-questions/stats/overview` - 문제 통계

### 🆕 시험 관리 (CBT)
- `GET /api/exams` - 시험 목록 (교사용)
- `POST /api/exams` - 시험 출제
- `GET /api/exams/student/available` - 응시 가능 시험 (학생용)
- `GET /api/exams/:id/start` - 시험 시작
- `POST /api/exams/:id/submit` - 시험 제출
- `GET /api/exams/:id/results` - 시험 결과 조회

## 📅 개발 로드맵

### Phase 1: MVP (완료)
- [x] 프로젝트 초기 설정
- [x] 사용자 인증 시스템 (JWT)
- [x] 학생 관리 → 훈련생 관리로 업그레이드
- [x] 상담 관리 → 단계별 상담으로 업그레이드
- [x] **CBT 시스템 (문제은행, 시험, 채점)** ⭐

### Phase 2: HRD 특화 (진행 예정)
- [ ] 출결 시스템 (QR/비콘)
- [ ] HRD-Net 연동
- [ ] 공결 처리 워크플로우
- [ ] 카카오 알림톡 연동
- [ ] PDF 증빙 서류 자동 생성

### Phase 3: 고도화 (계획)
- [ ] 취업 알선 및 매칭 시스템
- [ ] 강사료 자동 정산
- [ ] 사후 관리 자동화
- [ ] 모바일 앱 (훈련생용)
- [ ] 대시보드 고도화

## 🆕 주요 변경사항 (v2.0)

### 기존 → HRD 시스템

| 항목 | 기존 | 신규 |
|------|------|------|
| 데이터 모델 | Student | **Trainee** (재직자/구직자 구분) |
| 상담 관리 | 일반 상담 | **단계별 상담** (입학/훈련/취업) |
| 평가 시스템 | 성적 입력 | **CBT 온라인 시험** ⭐ |
| 취업 지원 | - | **Employment 모델 추가** |
| 문제은행 | - | **ExamQuestion 모델** |
| 시험 관리 | - | **Exam, ExamSubmission 모델** |

## 📝 라이선스

MIT License

## 👨‍💻 개발자

© 2025 HRD Management System
