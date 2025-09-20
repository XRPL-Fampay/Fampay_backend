const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const createError = require("http-errors");
const { prisma } = require("../db/prisma");
const config = require("../config");

const ACCESS_SECRET = config.auth.accessTokenSecret;
const REFRESH_SECRET = config.auth.refreshTokenSecret;
const ACCESS_TTL = config.auth.accessTokenTtl;
const REFRESH_TTL = config.auth.refreshTokenTtl;

function parseExpiresIn(ttl) {
  const match = ttl.match(/^(\d+)([smhdw])$/i);
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  return value * multipliers[unit] * 1000;
}

const REFRESH_TTL_MS = parseExpiresIn(REFRESH_TTL);

function hashData(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function ensureUser(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError(401, "잘못된 이메일 또는 비밀번호입니다.");
  }
  return user;
}

async function generateTokens(user, { userAgent, ipAddress }) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_TTL,
    }
  );

  const refreshToken = crypto.randomBytes(48).toString("hex");
  const refreshTokenHash = hashData(refreshToken + REFRESH_SECRET);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

async function registerUser({ email, password, fullName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError(409, "이미 사용 중인 이메일입니다.");
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;
  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
    },
  });

  return user;
}

async function loginUser({ email, password, userAgent, ipAddress }) {
  const user = await ensureUser(email);
  if (!user.passwordHash) {
    throw createError(400, "비밀번호 로그인을 지원하지 않습니다.");
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw createError(401, "잘못된 이메일 또는 비밀번호입니다.");
  }
  const tokens = await generateTokens(user, { userAgent, ipAddress });
  return { user, ...tokens };
}

async function refreshSession({ refreshToken, userAgent, ipAddress }) {
  if (!refreshToken) {
    throw createError(400, "refreshToken이 필요합니다.");
  }
  const refreshTokenHash = hashData(refreshToken + REFRESH_SECRET);
  const session = await prisma.session.findFirst({
    where: {
      refreshToken: refreshTokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) {
    throw createError(401, "유효하지 않은 refreshToken입니다.");
  }

  await prisma.session.delete({ where: { id: session.id } });
  const tokens = await generateTokens(session.user, { userAgent, ipAddress });
  return { user: session.user, ...tokens };
}

async function logoutSession({ refreshToken }) {
  if (!refreshToken) {
    return;
  }
  const refreshTokenHash = hashData(refreshToken + REFRESH_SECRET);
  await prisma.session.deleteMany({
    where: { refreshToken: refreshTokenHash },
  });
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      walletBackups: true,
      socialRecoveryConfig: true,
      multisigConfig: true,
    },
  });
  if (!user) {
    throw createError(404, "사용자를 찾을 수 없습니다.");
  }
  return user;
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw createError(400, "비밀번호 변경을 지원하지 않습니다.");
  }
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    throw createError(401, "현재 비밀번호가 올바르지 않습니다.");
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

async function connectWallet({ userId, xrplAddress, publicKey, label }) {
  if (!xrplAddress) {
    throw createError(400, "xrplAddress는 필수입니다.");
  }
  const wallet = await prisma.wallet.upsert({
    where: { xrplAddress },
    update: {
      ownerUserId: userId,
      label: label || undefined,
      publicKey: publicKey || undefined,
    },
    create: {
      xrplAddress,
      publicKey,
      label,
      ownerUserId: userId,
    },
  });
  if (!wallet.ownerUserId) {
    await prisma.user.update({
      where: { id: userId },
      data: { primaryWalletId: wallet.id },
    });
  }
  return wallet;
}

async function setupTwoFactor({ userId }) {
  const secret = crypto.randomBytes(20).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });
  return { secret };
}

async function setupBiometric({ userId, metadata }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const currentMeta =
    user?.biometricMeta && typeof user.biometricMeta === "object"
      ? user.biometricMeta
      : {};
  await prisma.user.update({
    where: { id: userId },
    data: { biometricMeta: { ...currentMeta, biometric: metadata } },
  });
  return { success: true };
}

module.exports = {
  registerUser,
  loginUser,
  refreshSession,
  logoutSession,
  getProfile,
  changePassword,
  connectWallet,
  setupTwoFactor,
  setupBiometric,
};
