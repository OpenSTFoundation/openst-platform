"use strict";

/**
 * Stake and mint ST Prime
 *
 * @module tools/setup/simple_token_prime/mint
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , approveService = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , startStakeService = require(rootPrefix + '/services/stake_and_mint/start_stake')
  , fundManager = require(rootPrefix + '/tools/setup/fund_manager')
;

const stakerAddr = coreAddresses.getAddressForUser('staker')
  , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
  , utilityChainOwnerPassphrase = coreAddresses.getPassphraseForUser('utilityChainOwner')
;

/**
 * Constructor for Stake and mInt Simple Token Prime
 *
 * @constructor
 */
const StakeAndMintSimpleTokenPrime = function () {
};

StakeAndMintSimpleTokenPrime.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    logger.step("** Starting stake mint for st prime for beneficiary utilityChainOwner");
    const oThis = this
      , toStakeAmount = (new BigNumber(10000)).mul(new BigNumber(10).toPower(18))
    ;

    logger.info('* Utility Chain Owner transfers ST to staker');
    await fundManager.transferST(
        utilityChainOwnerAddr, utilityChainOwnerPassphrase, stakerAddr, toStakeAmount,
        {tag: 'transferSTToStaker', returnType: 'txReceipt'}
    );

    logger.info('* Staker approves openSTValue contract');
    const approveResponse = await (new approveService()).perform();
    if (approveResponse.isFailure()) {
      process.exit(1);
    }

    const approveTransactionHash = approveResponse.data.transaction_hash;

    logger.info('* Get approval status and keep doing so till success');
    const approveReceiptResponse =  await contractInteractHelper.waitAndGetTransactionReceipt(web3Provider, approveTransactionHash, {});
    if (!approveReceiptResponse.isSuccess()) {
      logger.error('Approval receipt error ' + JSON.stringify(approveReceiptResponse));
      process.exit(1);
    }

    logger.info('* Start stake');

    await (new startStakeService({
      beneficiary: utilityChainOwnerAddr,
      to_stake_amount: toStakeAmount,
      uuid: coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID
    })).perform();

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
    return new Promise(function(onResolve, onReject) {

      const getBalance = async function(){

        const getSTPBalanceResponse = await fundManager.getSTPrimeBalanceOf(utilityChainOwnerAddr);

        if(getSTPBalanceResponse.isSuccess() && (new BigNumber(getSTPBalanceResponse.data.balance)).greaterThan(0)){
          logger.info('* ST\' credited to utility chain owner');
          return onResolve(getSTPBalanceResponse);
        } else {
          logger.info('* Waiting for credit of ST\' to utility chain owner');
          setTimeout(getBalance, 60000);
        }
      };

      getBalance();
    });
  }
};

module.exports = new StakeAndMintSimpleTokenPrime();