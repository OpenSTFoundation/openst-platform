"use strict";

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = ".."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  

  , getReceipt = require(rootPrefix + '/services/transaction/get_receipt')
  // , estimateGas = require(rootPrefix + '/services/transaction/estimate_gas')
  // , transferBrandedToken = require(rootPrefix + '/services/transaction/transfer/branded_token')
  // , transferSimpleToken = require(rootPrefix + '/services/transaction/transfer/simple_token')
  // , transferSimpleTokenPrime = require(rootPrefix + '/services/transaction/transfer/simple_token_prime')
  // , transferEth = require(rootPrefix + '/services/transaction/transfer/eth')

  // , approveForBrandedToken = require(rootPrefix + '/services/approve/branded_token')

  // , getBrandedTokenBalance = require(rootPrefix + '/services/balance/branded_token')
  // , getBrandedTokenBalanceFromChain = require(rootPrefix + '/services/balance/branded_token_from_chain')
  // , getSimpleTokenBalance = require(rootPrefix + '/services/balance/simple_token')
  // , getSimpleTokenPrimeBalance = require(rootPrefix + '/services/balance/simple_token_prime')
  // , getEthBalance = require(rootPrefix + '/services/balance/eth')

  // , proposeBrandedToken = require(rootPrefix + '/services/on_boarding/propose_branded_token')
  // , getRegistrationStatus = require(rootPrefix + '/services/on_boarding/get_registration_status')

  // , approveForStake = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  // , getApprovalStatusForStake = require(rootPrefix + '/services/stake_and_mint/get_approval_status')
  // , startStake = require(rootPrefix + '/services/stake_and_mint/start_stake')
  // , getStakedAmount = require(rootPrefix + '/services/stake_and_mint/get_staked_amount')

  // , approveForRedeem = require(rootPrefix + '/services/redeem_and_unstake/approveOpenStUtilityContract')
  // , getApprovalStatusForRedeem = require(rootPrefix + '/services/redeem_and_unstake/getApprovalStatus')
  // , startRedeem = require(rootPrefix + '/services/redeem_and_unstake/startRedeem')

  // , generateAddress = require(rootPrefix + '/services/utils/generate_address')
  // , generateRawKey = require(rootPrefix + '/services/utils/generate_raw_key')
  // , platformStatus = require(rootPrefix + '/services/utils/platform_status')
  // , getBrandedTokenDetails = require(rootPrefix + '/services/utils/get_branded_token_details')

  // , RegisterBrandedTokenInterComm = require(rootPrefix + '/services/inter_comm/register_branded_token')
  // , StakeAndMintInterCommKlass = require(rootPrefix + '/services/inter_comm/stake_and_mint')
  // , StakeAndMintProcessorInterCommKlass = require(rootPrefix + '/services/inter_comm/stake_and_mint_processor')  
;

/**
 * Service Manifest Constructor
 *
 * @constructor
 */
const ServiceManifestKlass = function (configStrategy, instanceComposer) {
  const oThis = this;
  /**
   * Transactions related services
  **/

  let transaction = this.transaction = {};
  transaction.getReceipt = instanceComposer.createShadowClass( getReceipt );
  // transaction.estimateGas = instanceComposer.createShadowClass( estimateGas );
  // let transfer = transaction.transfer = {};
  // transfer.brandedToken = instanceComposer.createShadowClass( transferBrandedToken );
  // transfer.simpleToken = instanceComposer.createShadowClass( transferSimpleToken );
  // transfer.simpleTokenPrime = instanceComposer.createShadowClass( transferSimpleTokenPrime );
  // transfer.eth = instanceComposer.createShadowClass( transferEth );
  
};

ServiceManifestKlass.prototype = {
  /**
   * Approve for spending services
   *
   * @constant {object}
   */
  // approve: {
  //   brandedToken: approveForBrandedToken
  // },

  // /**
  //  * Transactions related services
  //  *
  //  * @constant {object}
  //  */
  // transaction: {
  //   getReceipt: getReceipt,
  //   estimateGas: estimateGas,

  //   transfer: {
  //     brandedToken: transferBrandedToken,
  //     simpleToken: transferSimpleToken,
  //     simpleTokenPrime: transferSimpleTokenPrime,
  //     eth: transferEth
  //   }
  // },

  // /**
  //  * Balance related services
  //  *
  //  * @constant {object}
  //  */
  // balance: {
  //   brandedToken: getBrandedTokenBalance,
  //   brandedTokenFromChain: getBrandedTokenBalanceFromChain,
  //   simpleToken: getSimpleTokenBalance,
  //   simpleTokenPrime: getSimpleTokenPrimeBalance,
  //   eth: getEthBalance
  // },

  // /**
  //  * On-Boarding related services
  //  *
  //  * @constant {object}
  //  */
  // onBoarding: {
  //   proposeBrandedToken: proposeBrandedToken,
  //   getRegistrationStatus: getRegistrationStatus
  // },

  // *
  //  * Stake related services
  //  *
  //  * @constant {object}
   
  // stake: {
  //   approveForStake: approveForStake,
  //   getApprovalStatus: getApprovalStatusForStake,
  //   start: startStake,
  //   getStakedAmount: getStakedAmount
  // },

  // /**
  //  * Redeem related services
  //  *
  //  * @constant {object}
  //  */
  // redeem: {
  //   approveForRedeem: approveForRedeem,
  //   getApprovalStatus: getApprovalStatusForRedeem,
  //   start: startRedeem
  // },

  // /**
  //  * Utils services
  //  *
  //  * @constant {object}
  //  */
  // utils: {
  //   generateAddress: generateAddress,
  //   platformStatus: platformStatus,
  //   getBrandedTokenDetails: getBrandedTokenDetails,
  //   generateRawKey: generateRawKey
  // },

  // /**
  //  * Intercomm services
  //  *
  //  * @constant {object}
  //  */
  // interComm: {
  //   registerBrandedToken: RegisterBrandedTokenInterComm,
  //   stakeAndMint: StakeAndMintInterCommKlass,
  //   stakeAndMintProcessor: StakeAndMintProcessorInterCommKlass
  // }
};

InstanceComposer.register(ServiceManifestKlass, "getServiceManifest", true);

module.exports = ServiceManifestKlass;