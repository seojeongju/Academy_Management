import { User } from '../models/index.js';
import { syncDatabase } from '../config/database.js';

async function createInitialData() {
    try {
        // Sync database
        console.log('🔄 Syncing database...');
        await syncDatabase(true); // Force sync to recreate tables

        // Create admin user
        console.log('👤 Creating admin user...');
        const admin = await User.create({
            username: 'admin',
            email: 'admin@academy.com',
            password: 'admin123',
            name: '관리자',
            role: 'admin',
            phone: '010-1234-5678'
        });
        console.log('✅ Admin user created:', admin.username);

        // Create teacher user
        console.log('👤 Creating teacher user...');
        const teacher = await User.create({
            username: 'teacher',
            email: 'teacher@academy.com',
            password: 'teacher123',
            name: '김강사',
            role: 'teacher',
            phone: '010-9876-5432'
        });
        console.log('✅ Teacher user created:', teacher.username);

        console.log('\n✨ Initial data created successfully!');
        console.log('\n📋 Test Credentials:');
        console.log('   Admin    - username: admin    password: admin123');
        console.log('   Teacher  - username: teacher  password: teacher123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating initial data:', error);
        process.exit(1);
    }
}

createInitialData();
