const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

async function connect() {
  await prisma.$connect();
  return prisma;
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  connect,
  disconnect
};
