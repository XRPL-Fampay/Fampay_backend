const { prisma } = require('../db/prisma');

async function createTestUser(req, res, next) {
  try {
    const { userId = 'test-user', fullName = 'Test User', email } = req.body || {};

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        fullName,
        email
      }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTestUser,
  listUsers
};