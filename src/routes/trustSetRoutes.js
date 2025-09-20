const express = require("express");
const router = express.Router();
const trustSetController = require("../controllers/trustSetController");

/**
 * TrustSet 관련 라우터
 * Base URL: /api/trustset
 */

/**
 * @route   POST /api/trustset/create
 * @desc    Create a TrustLine between user and issuer
 * @access  Public (나중에 인증 미들웨어 추가 예정)
 * @body    {
 *            userSeed: string,
 *            issuerAddress: string,
 *            currencyCode: string,
 *            limit: string
 *          }
 */
router.post(
  "/create",
  trustSetController.createTrustLine.bind(trustSetController)
);

/**
 * @route   GET /api/trustset/lines/:address
 * @desc    Get all TrustLines for a specific address
 * @access  Public
 * @param   address - XRPL account address
 */
router.get(
  "/lines/:address",
  trustSetController.getTrustLines.bind(trustSetController)
);

/**
 * @route   GET /api/trustset/require-auth/:issuerAddress
 * @desc    Check if issuer has RequireAuth flag enabled
 * @access  Public
 * @param   issuerAddress - XRPL issuer account address
 */
router.get(
  "/require-auth/:issuerAddress",
  trustSetController.checkRequireAuth.bind(trustSetController)
);

/**
 * @route   POST /api/trustset/family-trust
 * @desc    Establish trust relationships for family group
 * @access  Public (나중에 인증 미들웨어 추가 예정)
 * @body    {
 *            familyMembers: Array<{seed: string, address: string}>,
 *            familyTokenIssuer: string,
 *            familyTokenCode: string,
 *            trustLimit: string
 *          }
 */
router.post(
  "/family-trust",
  trustSetController.establishFamilyTrust.bind(trustSetController)
);

/**
 * @route   DELETE /api/trustset/remove
 * @desc    Remove a TrustLine (set limit to 0)
 * @access  Public (나중에 인증 미들웨어 추가 예정)
 * @body    {
 *            userSeed: string,
 *            issuerAddress: string,
 *            currencyCode: string
 *          }
 */
router.delete(
  "/remove",
  trustSetController.removeTrustLine.bind(trustSetController)
);

module.exports = router;
