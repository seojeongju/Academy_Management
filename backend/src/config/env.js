import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    name: process.env.DB_NAME || 'academy_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  },

  // 카카오 알림톡
  kakao: {
    apiKey: process.env.KAKAO_API_KEY,
    sender: process.env.KAKAO_SENDER_KEY
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  }
};
