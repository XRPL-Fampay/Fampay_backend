const xrpl = require('xrpl');
const config = require('../config');

const toHex = (s) => Buffer.from(s, "utf8").toString("hex");

class XRPLCredentialService {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (!this.client) {
      this.client = new xrpl.Client(config.xrpl.server || "wss://s.devnet.rippletest.net:51233");
      await this.client.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  /**
   * Create credential for group member
   * @param {Object} params
   * @param {string} params.issuerSeed - Group wallet seed (issuer)
   * @param {string} params.subjectAddress - Member XRPL address (subject)
   * @param {string} params.credentialType - Type of credential (e.g., "GROUP_MEMBER")
   * @param {number} params.expirationHours - Hours until expiration (default: 8760 = 1 year)
   * @param {string} params.uri - Optional URI for additional info
   * @param {boolean} params.autoFund - Whether to auto-fund the issuer wallet if needed
   */
  async createCredential({
    issuerSeed,
    subjectAddress,
    credentialType = "GROUP_MEMBER",
    expirationHours = 8760, // 1 year
    uri = null,
    autoFund = true
  }) {
    await this.connect();

    try {
      const issuer = xrpl.Wallet.fromSeed(issuerSeed);
      
      // Check if issuer wallet needs funding
      if (autoFund) {
        try {
          await this.client.request({
            command: "account_info",
            account: issuer.address
          });
        } catch (error) {
          if (error.data?.error === 'actNotFound') {
            console.log('🔄 Issuer wallet not found, funding wallet first...');
            await this.fundWallet(issuer);
            // Wait a moment for the funding to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }
      const now = Math.floor(Date.now() / 1000);
      
      const tx = {
        TransactionType: "CredentialCreate",
        Account: issuer.address,
        Subject: subjectAddress,
        CredentialType: toHex(credentialType),
        Expiration: now + (expirationHours * 3600)
      };

      if (uri) {
        tx.URI = toHex(uri);
      }

      console.log('📜 Creating credential:', {
        issuer: issuer.address,
        subject: subjectAddress,
        credentialType,
        expiration: new Date((now + (expirationHours * 3600)) * 1000).toISOString()
      });

      const prepared = await this.client.autofill(tx);
      const signed = issuer.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      const success = result.result.meta.TransactionResult === 'tesSUCCESS';
      const resultCode = result.result.meta.TransactionResult;
      
      let statusMessage = '';
      if (resultCode === 'tecNO_TARGET') {
        statusMessage = `Target address ${subjectAddress} not found on ledger (needs funding)`;
      } else if (!success) {
        statusMessage = `Transaction failed: ${resultCode}`;
      } else {
        statusMessage = 'Credential created successfully';
      }
      
      console.log(`${success ? '✅' : '❌'} Credential transaction:`, {
        hash: result.result.hash,
        result: resultCode,
        subject: subjectAddress,
        message: statusMessage
      });

      return {
        success,
        transactionHash: result.result.hash,
        credentialType,
        issuer: issuer.address,
        subject: subjectAddress,
        expiration: tx.Expiration,
        result: result.result
      };
    } catch (error) {
      console.error('❌ Error creating credential:', error);
      throw error;
    }
  }

  /**
   * Check if a subject has valid credentials
   * @param {string} subjectAddress - XRPL address to check
   * @param {string} issuerAddress - Expected issuer address
   * @param {string} credentialType - Expected credential type
   */
  async checkCredential(subjectAddress, issuerAddress, credentialType) {
    await this.connect();

    try {
      const response = await this.client.request({
        command: "account_objects",
        account: subjectAddress,
        type: "credential"
      });

      const credentials = response.result.account_objects || [];
      const now = Math.floor(Date.now() / 1000);

      // Find matching credential
      const validCredential = credentials.find(cred => {
        const credData = cred.credential || cred;
        return (
          credData.Issuer === issuerAddress &&
          credData.CredentialType === toHex(credentialType) &&
          (!credData.Expiration || credData.Expiration > now) &&
          credData.Flags !== undefined // Credential is accepted
        );
      });

      return {
        hasValidCredential: !!validCredential,
        credential: validCredential,
        allCredentials: credentials
      };
    } catch (error) {
      console.error('Error checking credential:', error);
      return {
        hasValidCredential: false,
        credential: null,
        allCredentials: []
      };
    }
  }

  /**
   * Fund a wallet on testnet
   * @param {Object} wallet - XRPL wallet object to fund
   */
  async fundWallet(wallet) {
    await this.connect();
    
    try {
      console.log('💰 Funding wallet on testnet:', wallet.address);
      const fundResult = await this.client.fundWallet(wallet);
      
      console.log('✅ Wallet funded successfully:', {
        address: wallet.address,
        balance: fundResult.balance
      });
      
      return {
        success: true,
        balance: fundResult.balance,
        address: wallet.address
      };
    } catch (error) {
      console.error('❌ Failed to fund wallet:', error);
      throw error;
    }
  }

  /**
   * Create permissioned domain for group wallet access control
   * @param {Object} params
   * @param {string} params.issuerSeed - Group wallet seed
   * @param {Array} params.acceptedCredentials - Array of accepted credential types
   * @param {boolean} params.autoFund - Whether to auto-fund the wallet if needed
   */
  async createPermissionedDomain({
    issuerSeed,
    acceptedCredentials = [{ credentialType: "GROUP_MEMBER" }],
    autoFund = true
  }) {
    await this.connect();

    try {
      const issuer = xrpl.Wallet.fromSeed(issuerSeed);
      
      // Check if wallet needs funding
      if (autoFund) {
        try {
          await this.client.request({
            command: "account_info",
            account: issuer.address
          });
        } catch (error) {
          if (error.data?.error === 'actNotFound') {
            console.log('🔄 Wallet not found, funding wallet first...');
            await this.fundWallet(issuer);
            // Wait a moment for the funding to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }

      const acceptedCreds = acceptedCredentials.map(cred => ({
        Credential: {
          Issuer: issuer.address,
          CredentialType: toHex(cred.credentialType)
        }
      }));

      const tx = {
        TransactionType: "PermissionedDomainSet",
        Account: issuer.address,
        AcceptedCredentials: acceptedCreds
      };

      console.log('🔐 Creating permissioned domain:', {
        issuer: issuer.address,
        acceptedCredentials: acceptedCredentials.map(c => c.credentialType)
      });

      const prepared = await this.client.autofill(tx);
      const signed = issuer.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      // Extract domain ID from result
      const meta = result.result.meta;
      const createdNode = (meta.AffectedNodes || []).find(
        n => n.CreatedNode?.LedgerEntryType === "PermissionedDomain"
      );
      
      const domainId = 
        createdNode?.CreatedNode?.LedgerIndex ||
        createdNode?.CreatedNode?.NewFields?.DomainID ||
        null;

      const success = result.result.meta.TransactionResult === 'tesSUCCESS';
      console.log(`${success ? '✅' : '❌'} Permissioned domain transaction:`, {
        hash: result.result.hash,
        result: result.result.meta.TransactionResult,
        domainId: domainId || 'NOT_FOUND'
      });

      return {
        success,
        transactionHash: result.result.hash,
        domainId,
        issuer: issuer.address,
        acceptedCredentials: acceptedCreds,
        result: result.result
      };
    } catch (error) {
      console.error('❌ Error creating permissioned domain:', error);
      throw error;
    }
  }

  /**
   * Create group member credentials for all members
   * @param {Object} params
   * @param {string} params.groupWalletSeed - Group wallet seed (issuer)
   * @param {Array} params.memberAddresses - Array of member XRPL addresses
   * @param {string} params.groupId - Group ID for URI
   */
  async createGroupMemberCredentials({
    groupWalletSeed,
    memberAddresses,
    groupId
  }) {
    const results = [];
    
    for (const memberAddress of memberAddresses) {
      try {
        const result = await this.createCredential({
          issuerSeed: groupWalletSeed,
          subjectAddress: memberAddress,
          credentialType: "GROUP_MEMBER",
          expirationHours: 8760, // 1 year
          uri: `fampay://group/${groupId}/member`
        });
        
        results.push({
          memberAddress,
          success: true,
          ...result
        });
      } catch (error) {
        console.error(`Failed to create credential for ${memberAddress}:`, error);
        results.push({
          memberAddress,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Generate funded test wallets for demonstration
   * @param {number} count - Number of wallets to generate
   */
  async generateFundedTestWallets(count = 2) {
    await this.connect();
    
    const wallets = [];
    console.log(`🧪 Generating ${count} funded test wallets...`);
    
    for (let i = 0; i < count; i++) {
      try {
        const wallet = xrpl.Wallet.generate();
        await this.fundWallet(wallet);
        
        wallets.push({
          address: wallet.address,
          seed: wallet.seed,
          publicKey: wallet.publicKey
        });
        
        console.log(`✅ Test wallet ${i + 1} generated: ${wallet.address}`);
        
        // Wait between wallet generations to avoid rate limits
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed to generate test wallet ${i + 1}:`, error);
      }
    }
    
    return wallets;
  }
}

module.exports = new XRPLCredentialService();