const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const config = require('../config');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
});

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');
  if (!token) {
    return next(createError(401, '인증 토큰이 필요합니다.'));
  }
  try {
    const payload = jwt.verify(token, config.auth.accessTokenSecret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(createError(401, '유효하지 않은 토큰입니다.'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, '인증이 필요합니다.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(403, '권한이 없습니다.'));
    }
    next();
  };
}

module.exports = {
  loginLimiter,
  generalLimiter,
  authenticate,
  requireRole
};
