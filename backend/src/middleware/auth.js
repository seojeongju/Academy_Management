import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 제공되지 않았습니다.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from database with Trainee profile if exists
        const user = await User.findByPk(decoded.userId, {
            include: ['trainee_profile']
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: '비활성화된 계정입니다.'
            });
        }

        // Attach user to request
        req.user = user.toSafeObject();
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        }

        return res.status(500).json({
            success: false,
            message: '인증 처리 중 오류가 발생했습니다.'
        });
    }
};

// Authorization middleware - check user role
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        next();
    };
};
