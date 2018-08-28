'use strict';

/**
 * Stake and mint ST Prime
 *
 * @module tools/setup/simple_token_prime/mint
 */

const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract');
require(rootPrefix + '/services/stake_and_mint/start_stake');
require(rootPrefix + '/tools/setup/fund_manager');

/**
 * Constructor for Stake and mInt Simple Token Prime
 *
 * @constructor
 */
const StakeAndMintSimpleTokenPrime = function(configStrategy, instanceComposer) {};

StakeAndMintSimpleTokenPrime.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      approveService = oThis.ic().getApproveOpenstValueContractService(),
      contractInteractHelper = oThis.ic().getContractInteractHelper(),
      startStakeService = oThis.ic().getStartStakeService(),
      fundManager = oThis.ic().getSetupFundManager(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      stakerAddr = coreAddresses.getAddressForUser('staker'),
      utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner'),
      utilityChainOwnerPassphrase = coreAddresses.getPassphraseForUser('utilityChainOwner'),
      toStakeAmount = new BigNumber(10000).mul(new BigNumber(10).toPower(18)),
      web3Provider = web3ProviderFactory.getProvider('value', web3ProviderFactory.typeWS);

    logger.step('** Starting stake mint for st prime for beneficiary utilityChainOwner');

    logger.info('* Utility Chain Owner transfers ST to staker');
    await fundManager.transferST(utilityChainOwnerAddr, utilityChainOwnerPassphrase, stakerAddr, toStakeAmount, {
      tag: 'transferSTToStaker',
      returnType: 'txReceipt'
    });

    logger.info('* Staker approves openSTValue contract');
    const approveResponse = await new approveService().perform();
    if (approveResponse.isFailure()) {
      process.exit(1);
    }

    const approveTransactionHash = approveResponse.data.transaction_hash;

    logger.info('* Get approval status and keep doing so till success');
    const approveReceiptResponse = await contractInteractHelper.waitAndGetTransactionReceipt(
      web3Provider,
      approveTransactionHash,
      {}
    );
    if (!approveReceiptResponse.isSuccess()) {
      logger.error('Approval receipt error ', approveReceiptResponse);
      process.exit(1);
    }

    logger.info('* Start stake');

    await new startStakeService({
      beneficiary: utilityChainOwnerAddr,
      to_stake_amount: toStakeAmount,
      uuid: coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID
    }).perform();

    await oThis._waitForSTPrimeMint();

    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Wait for ST Prime mint
   *
   * @return {promise}
   * @private
   */
  _waitForSTPrimeMint: function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner');

    return new Promise(function(onResolve, onReject) {
      const getBalance = async function() {
        let fundManager = oThis.ic().getSetupFundManager();

        const getSTPBalanceResponse = await fundManager.getSTPrimeBalanceOf(utilityChainOwnerAddr);

        if (getSTPBalanceResponse.isSuccess() && new BigNumber(getSTPBalanceResponse.data.balance).greaterThan(0)) {
          logger.info("* ST' credited to utility chain owner");
          return onResolve(getSTPBalanceResponse);
        } else {
          logger.info("* Waiting for credit of ST' to utility chain owner");
          setTimeout(getBalance, 60000);
        }
      };

      getBalance();
    });
  }
};

InstanceComposer.register(StakeAndMintSimpleTokenPrime, 'getStakeAndMintSTPrimeMinter', true);

module.exports = StakeAndMintSimpleTokenPrime;
