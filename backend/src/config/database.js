import { Sequelize } from 'sequelize';
import config from './env.js';

// For development, use SQLite
const isDevelopment = config.nodeEnv === 'development';

const sequelize = isDevelopment
    ? new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        }
    })
    : new Sequelize(
        config.database.name,
        config.database.username,
        config.database.password,
        {
            host: config.database.host,
            port: config.database.port,
            dialect: config.database.dialect,
            logging: config.database.logging,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true,
                freezeTableName: true,
            }
        }
    );

// Test database connection
export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        return false;
    }
};

// Sync all models
// Sync all models
export const syncDatabase = async (options = { force: false }) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Database sync failed:', error);
        throw error;
    }
};

export default sequelize;
