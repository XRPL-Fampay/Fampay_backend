-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('MEMBER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "biometricMeta" JSONB,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "public"."CashoutReceipt" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashoutReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletBackup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialRecoveryConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guardians" JSONB NOT NULL,
    "threshold" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialRecoveryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MultisigConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signers" JSONB NOT NULL,
    "quorum" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MultisigConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovedGateway" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovedGateway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashoutReceipt_requestId_key" ON "public"."CashoutReceipt"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "CashoutReceipt_hash_key" ON "public"."CashoutReceipt"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "public"."Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "SocialRecoveryConfig_userId_key" ON "public"."SocialRecoveryConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MultisigConfig_userId_key" ON "public"."MultisigConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovedGateway_groupId_provider_domain_key" ON "public"."ApprovedGateway"("groupId", "provider", "domain");

-- AddForeignKey
ALTER TABLE "public"."CashoutReceipt" ADD CONSTRAINT "CashoutReceipt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."CashoutRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletBackup" ADD CONSTRAINT "WalletBackup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialRecoveryConfig" ADD CONSTRAINT "SocialRecoveryConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultisigConfig" ADD CONSTRAINT "MultisigConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovedGateway" ADD CONSTRAINT "ApprovedGateway_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
