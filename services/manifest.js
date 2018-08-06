'use strict';

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

// Approve related services
require(rootPrefix + '/services/approve/branded_token');

// Transaction related services
require(rootPrefix + '/services/transaction/get_receipt');
require(rootPrefix + '/services/transaction/estimate_gas');
require(rootPrefix + '/services/transaction/transfer/branded_token');
require(rootPrefix + '/services/transaction/transfer/simple_token');
require(rootPrefix + '/services/transaction/transfer/eth');
require(rootPrefix + '/services/transaction/transfer/simple_token_prime');

// Balance related services
require(rootPrefix + '/services/balance/branded_token');
require(rootPrefix + '/services/balance/branded_token_from_chain');
require(rootPrefix + '/services/balance/simple_token');
require(rootPrefix + '/services/balance/simple_token_prime');
require(rootPrefix + '/services/balance/eth');

//stake and mint related changes
require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract');
require(rootPrefix + '/services/stake_and_mint/get_staked_amount');
require(rootPrefix + '/services/stake_and_mint/start_stake');
require(rootPrefix + '/services/stake_and_mint/get_approval_status');

// Utils services
require(rootPrefix + '/services/utils/platform_status');
require(rootPrefix + '/services/utils/generate_address');
require(rootPrefix + '/services/utils/get_branded_token_details');
require(rootPrefix + '/services/utils/generate_raw_key');

// on boarding related services
require(rootPrefix + '/services/on_boarding/get_registration_status');
require(rootPrefix + '/services/on_boarding/propose_branded_token');

// Intercomm related services
require(rootPrefix + '/services/inter_comm/register_branded_token');
require(rootPrefix + '/services/inter_comm/stake_and_mint');
require(rootPrefix + '/services/inter_comm/stake_and_mint_processor');

/**
 * Service Manifest Constructor
 *
 * @constructor
 */
const ServiceManifestKlass = function(configStrategy, instanceComposer) {
  const oThis = this;

  /**
   * Approve services
   **/
  let approve = (oThis.approve = {});
  approve.brandedToken = instanceComposer.getApproveBrandedTokenService();

  /**
   * Transactions related services
   **/
  let transaction = (oThis.transaction = {});
  transaction.getReceipt = instanceComposer.getTransactionReceiptService();
  transaction.estimateGas = instanceComposer.getEstimateGasService();

  /**
   * transfer related services
   **/
  let transfer = (transaction.transfer = {});
  transfer.brandedToken = instanceComposer.getTransferBrandedTokenService();
  transfer.simpleToken = instanceComposer.getTransferSimpleTokenService();
  transfer.simpleTokenPrime = instanceComposer.getTransferSimpleTokenPrimeService();
  transfer.eth = instanceComposer.getTransferEthService();

  /**
   * Balance related services
   **/
  let balance = (oThis.balance = {});
  balance.brandedToken = instanceComposer.getBrandedTokenBalanceService();
  balance.brandedTokenFromChain = instanceComposer.getBtBalanceFromChainService();
  balance.simpleToken = instanceComposer.getSimpleTokenBalanceService();
  balance.simpleTokenPrime = instanceComposer.getSimpleTokenPrimeBalanceService();
  balance.eth = instanceComposer.getEthBalanceService();

  /**
   * Utils services
   */
  let utils = (oThis.utils = {});
  utils.platformStatus = instanceComposer.getPlatformStatusService();
  utils.generateAddress = instanceComposer.getGenerateAddressService();
  utils.getBrandedTokenDetails = instanceComposer.getBrandedTokenDetailsService();
  utils.generateRawKey = instanceComposer.getGenerateRawKeyService();

  /**
   * onBoarding services
   */
  let onBoarding = (oThis.onBoarding = {});
  onBoarding.getRegistrationStatus = instanceComposer.getRegistrationStatusService();
  onBoarding.proposeBrandedToken = instanceComposer.getProposeBrandedTokenKlassClass();

  /**
   * stake related services
   **/
  let stake = (oThis.stake = {});
  stake.approveForStake = instanceComposer.getApproveOpenstValueContractService();
  stake.getApprovalStatus = instanceComposer.getApprovalStatusService();
  stake.start = instanceComposer.getStartStakeService();
  stake.getStakedAmount = instanceComposer.getGetStakeAmountService();

  /**
   * intercomm related services
   **/
  let interComm = (oThis.interComm = {});
  interComm.registerBrandedToken = instanceComposer.getRegisterBrandedTokenInterCommService();
  interComm.stakeAndMint = instanceComposer.getStakeAndMintInterCommService();
  interComm.stakeAndMintProcessor = instanceComposer.getStakeAndMintProcessorInterCommService();
};

ServiceManifestKlass.prototype = {};

InstanceComposer.register(ServiceManifestKlass, 'getServiceManifest', true);

module.exports = ServiceManifestKlass;
