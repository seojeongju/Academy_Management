import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => c.text('Academy Management API (Workers + D1)'));

// --- Students (Trainees) API ---

// Get all students
app.get('/api/students', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM Trainees ORDER BY created_at DESC'
        ).all();
        return c.json({ success: true, data: results });
    } catch (e) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// Create student
app.post('/api/students', async (c) => {
    try {
        const body = await c.req.json();
        const { name, trainee_number, trainee_type, course_name, phone, email, birth_date, status } = body;

        const result = await c.env.DB.prepare(
            `INSERT INTO Trainees (name, trainee_number, trainee_type, course_name, phone, email, birth_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(name, trainee_number, trainee_type, course_name, phone, email, birth_date, status).run();

        return c.json({ success: true, message: 'Student created', data: result }, 201);
    } catch (e) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// --- Consultations API ---

// Get all consultations
app.get('/api/consultations', async (c) => {
    try {
        // Join with Trainees to get student name
        const { results } = await c.env.DB.prepare(
            `SELECT C.*, T.name as student_name, T.trainee_number 
       FROM Consultations C 
       LEFT JOIN Trainees T ON C.trainee_id = T.id 
       ORDER BY C.consult_date DESC`
        ).all();

        // Format data to match frontend expectation (nested student object)
        const formattedResults = results.map(row => ({
            ...row,
            student: { name: row.student_name, trainee_number: row.trainee_number }
        }));

        return c.json({ success: true, data: formattedResults });
    } catch (e) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// Create consultation
app.post('/api/consultations', async (c) => {
    try {
        const body = await c.req.json();
        const { trainee_id, consult_date, consultation_phase, category, contact_method, importance, content, action_taken, next_follow_up_date } = body;

        const result = await c.env.DB.prepare(
            `INSERT INTO Consultations (trainee_id, consult_date, consultation_phase, category, contact_method, importance, content, action_taken, next_follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(trainee_id, consult_date, consultation_phase, category, contact_method, importance, content, action_taken, next_follow_up_date).run();

        return c.json({ success: true, message: 'Consultation created', data: result }, 201);
    } catch (e) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// --- Auth API (Simple Mock for now) ---
app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    // Simple check (In production, use bcrypt and JWT)
    const { results } = await c.env.DB.prepare(
        'SELECT * FROM Users WHERE username = ? AND password = ?'
    ).bind(username, password).all();

    if (results.length > 0) {
        const user = results[0];
        return c.json({
            success: true,
            token: 'mock-jwt-token', // Replace with real JWT generation
            user: { id: user.id, username: user.username, name: user.name, role: user.role }
        });
    } else {
        return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }
});

export default app;
