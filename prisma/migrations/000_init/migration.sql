-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."GroupMemberRole" AS ENUM ('HOST', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."GroupMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "public"."RecurringPlanType" AS ENUM ('CONTRIBUTION', 'PAYOUT');

-- CreateEnum
CREATE TYPE "public"."RecurringPlanStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('CONTRIBUTION', 'PAYOUT', 'ESCROW_CREATE', 'ESCROW_FINISH', 'ESCROW_CANCEL', 'BATCH');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."CashoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "primaryWalletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "xrplAddress" TEXT NOT NULL,
    "publicKey" TEXT,
    "encryptedSecret" TEXT,
    "label" TEXT,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "groupWalletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "public"."GroupMemberStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecurringPlan" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "public"."RecurringPlanType" NOT NULL,
    "amountDrops" DECIMAL(20,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XRP',
    "scheduleCron" TEXT NOT NULL,
    "memo" TEXT,
    "destinationWalletId" TEXT,
    "escrowReleaseAt" TIMESTAMP(3),
    "status" "public"."RecurringPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "xrplHash" TEXT,
    "type" "public"."TransactionType" NOT NULL,
    "amountDrops" DECIMAL(20,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XRP',
    "sourceWalletId" TEXT,
    "destinationWalletId" TEXT,
    "memo" TEXT,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "recurringPlanId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PermissionedDomain" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "label" TEXT,
    "createdById" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "PermissionedDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashoutRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "requestedAmountDrops" DECIMAL(20,0) NOT NULL,
    "targetDomainId" TEXT NOT NULL,
    "status" "public"."CashoutStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CashoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryWalletId_key" ON "public"."User"("primaryWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_xrplAddress_key" ON "public"."Wallet"("xrplAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Group_groupWalletId_key" ON "public"."Group"("groupWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "public"."GroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_xrplHash_key" ON "public"."Transaction"("xrplHash");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionedDomain_groupId_domain_key" ON "public"."PermissionedDomain"("groupId", "domain");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_primaryWalletId_fkey" FOREIGN KEY ("primaryWalletId") REFERENCES "public"."Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_groupWalletId_fkey" FOREIGN KEY ("groupWalletId") REFERENCES "public"."Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringPlan" ADD CONSTRAINT "RecurringPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringPlan" ADD CONSTRAINT "RecurringPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringPlan" ADD CONSTRAINT "RecurringPlan_destinationWalletId_fkey" FOREIGN KEY ("destinationWalletId") REFERENCES "public"."Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_sourceWalletId_fkey" FOREIGN KEY ("sourceWalletId") REFERENCES "public"."Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_destinationWalletId_fkey" FOREIGN KEY ("destinationWalletId") REFERENCES "public"."Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_recurringPlanId_fkey" FOREIGN KEY ("recurringPlanId") REFERENCES "public"."RecurringPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionedDomain" ADD CONSTRAINT "PermissionedDomain_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionedDomain" ADD CONSTRAINT "PermissionedDomain_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashoutRequest" ADD CONSTRAINT "CashoutRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashoutRequest" ADD CONSTRAINT "CashoutRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."GroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashoutRequest" ADD CONSTRAINT "CashoutRequest_targetDomainId_fkey" FOREIGN KEY ("targetDomainId") REFERENCES "public"."PermissionedDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

