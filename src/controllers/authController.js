const createError = require('http-errors');
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body || {};
    if (!email || !fullName) {
      throw createError(400, 'email과 fullName은 필수입니다.');
    }
    const user = await authService.registerUser({ email, password, fullName });
    res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.loginUser({
      email,
      password,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });
    res.status(200).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.expiresAt
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    const result = await authService.refreshSession({
      refreshToken,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.expiresAt
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    await authService.logoutSession({ refreshToken });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword) {
      throw createError(400, '새 비밀번호가 필요합니다.');
    }
    await authService.changePassword({ userId: req.user.id, currentPassword, newPassword });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function connectWallet(req, res, next) {
  try {
    const wallet = await authService.connectWallet({ userId: req.user.id, ...req.body });
    res.status(200).json(wallet);
  } catch (error) {
    next(error);
  }
}

async function setup2fa(req, res, next) {
  try {
    const result = await authService.setupTwoFactor({ userId: req.user.id });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function setupBiometric(req, res, next) {
  try {
    const { metadata } = req.body || {};
    const result = await authService.setupBiometric({ userId: req.user.id, metadata });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  changePassword,
  connectWallet,
  setup2fa,
  setupBiometric
};
