import sequelize from './src/config/database.js';
import { User, Course, Trainee, Enrollment, Exam, ExamQuestion } from './src/models/index.js';

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Create Student User
        const uniqueId = Date.now();
        const studentUser = await User.create({
            username: `student_${uniqueId}`,
            password: 'password123', // Hook will hash this
            name: '테스트학생',
            email: `student_${uniqueId}@test.com`,
            role: 'student',
            phone: '010-1111-2222'
        });
        console.log(`Student User Created: ${studentUser.username} / password123`);

        // 2. Create Trainee Profile
        const trainee = await Trainee.create({
            name: '테스트학생',
            trainee_type: 'job_seeker',
            phone: '010-1111-2222',
            email: studentUser.email,
            user_id: studentUser.id
        });
        console.log('Trainee Profile Created');

        // Find Admin
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (!admin) {
            console.log('Admin not found, creating dummy teacher...');
            // In real scenario, we should create one. But for now let's assume it exists or throw error.
            throw new Error('Admin user required for teacher_id');
        }

        // 3. Create Course
        const course = await Course.create({
            name: '풀스택 개발자 양성 과정',
            subject: 'Web Development',
            grade_level: 'All',
            start_date: new Date(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            is_active: true,
            teacher_id: admin.id
        });
        console.log('Course Created');

        // 4. Enroll Student
        await Enrollment.create({
            student_id: trainee.id,
            course_id: course.id,
            status: 'active',
            enrollment_date: new Date()
        });
        console.log('Student Enrolled');

        // 5. Create Exam
        const exam = await Exam.create({
            course_id: course.id,
            teacher_id: admin.id,
            title: '중간 평가 (JavaScript)',
            exam_type: 'midterm',
            start_time: new Date(new Date().getTime() - 3600000), // 1 hour ago
            end_time: new Date(new Date().getTime() + 86400000), // Tomorrow
            time_limit: 60,
            is_active: true,
            total_score: 100,
            questions: [] // Will update later
        });
        console.log('Exam Created');

        // 6. Create Questions
        const q1 = await ExamQuestion.create({
            exam_id: exam.id,
            teacher_id: admin.id,
            question_text: 'JavaScript에서 변수를 선언하는 키워드가 아닌 것은?',
            type: 'multiple_choice',
            options: ['var', 'let', 'const', 'int'],
            correct_answer: '4',
            score_weight: 20,
            explanation: 'int는 Java나 C 등에서 사용되는 타입입니다.'
        });

        const q2 = await ExamQuestion.create({
            exam_id: exam.id,
            teacher_id: admin.id,
            question_text: 'JavaScript는 컴파일 언어이다.',
            type: 'true_false',
            options: ['True', 'False'],
            correct_answer: '2', // False
            score_weight: 20,
            explanation: 'JavaScript는 인터프리터 언어입니다.'
        });

        const q3 = await ExamQuestion.create({
            exam_id: exam.id,
            teacher_id: admin.id,
            question_text: 'DOM의 약자는 무엇인가?',
            type: 'short_answer',
            correct_answer: 'Document Object Model',
            score_weight: 30,
            explanation: 'Document Object Model'
        });

        // Update Exam with questions config
        await exam.update({
            questions: [
                { id: q1.id, score: 20 },
                { id: q2.id, score: 20 },
                { id: q3.id, score: 30 }
            ]
        });
        console.log('Questions Created and Linked');

        console.log('✅ Seed Data Creation Completed!');
        console.log(`👉 Login with: ${studentUser.username} / password123`);

    } catch (error) {
        console.error('Seed Failed:', error);
    } finally {
        process.exit();
    }
}

seedData();
