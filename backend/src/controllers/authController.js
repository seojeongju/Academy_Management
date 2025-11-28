import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import config from '../config/env.js';

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (but in production, only admin should register users)
export const register = async (req, res, next) => {
    try {
        const { username, email, password, name, role, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '이미 존재하는 이메일 또는 사용자명입니다.'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            name,
            role: role || 'teacher',
            phone
        });

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            data: {
                user: user.toSafeObject(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '사용자명과 비밀번호를 입력해주세요.'
            });
        }

        // Find user
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '잘못된 사용자명 또는 비밀번호입니다.'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
            });
        }

        // Validate password
        const isPasswordValid = await user.validatePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '잘못된 사용자명 또는 비밀번호입니다.'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: '로그인되었습니다.',
            data: {
                user: user.toSafeObject(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        res.json({
            success: true,
            data: user.toSafeObject()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, email } = req.body;

        const user = await User.findByPk(req.user.id);

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (email) user.email = email;

        await user.save();

        res.json({
            success: true,
            message: '프로필이 업데이트되었습니다.',
            data: user.toSafeObject()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
            });
        }

        const user = await User.findByPk(req.user.id);

        // Validate current password
        const isValid = await user.validatePassword(currentPassword);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: '현재 비밀번호가 일치하지 않습니다.'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });
    } catch (error) {
        next(error);
    }
};
