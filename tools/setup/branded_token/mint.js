"use strict";

/**
 * Stake and mint Branded Token
 *
 * @module tools/setup/branded_token/mint
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , approveService = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  , getApprovalStatusService = require(rootPrefix + '/services/stake_and_mint/get_approval_status')
  , startStakeService = require(rootPrefix + '/services/stake_and_mint/start_stake')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , tokenHelper = require(rootPrefix + '/tools/setup/branded_token/helper')
;

const stakerAddr = coreAddresses.getAddressForUser('staker')
  , foundationAddr = coreAddresses.getAddressForUser('foundation')
  , foundationPassphrase = coreAddresses.getPassphraseForUser('utilityChainOwner')
;

/**
 * Constructor for Mint Branded Token
 *
 * @constructor
 */
const MintBrandedToken = function (params) {
  const oThis = this
  ;

  oThis.uuid = params.uuid;
  oThis.amountToStakeInWeis = new BigNumber(params.amount_to_stake_in_weis);
  oThis.reserveAddr = params.reserve_address;
  oThis.reservePassphrase = params.reserve_passphrase;
  oThis.erc20Address = params.erc20_address;
};

MintBrandedToken.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    const oThis = this
    ;

    logger.step('** Starting stake mint for branded token for beneficiary reserve of BT Reserve:', oThis.reserveAddr);

    // NOTE: In real case, Member Company transfers ST to staker and then approve is called. To simulate this, foundation
    // is transfering ST to staker.
    logger.info('* Foundation transfers ST to BT Reserve');
    await fundManager.transferST(foundationAddr, foundationPassphrase, stakerAddr, oThis.amountToStakeInWeis);

    logger.info('* Staker approves openSTValue contract');
    const approveResponse = await (new approveService()).perform();
    if (approveResponse.isFailure()) {
      process.exit(1);
    }

    const approveTransactionHash = approveResponse.data.transaction_hash;

    logger.info('* Get approval status and keep doing so till success');
    await oThis._getApprovalStatus(approveTransactionHash);

    logger.info('* Start stake');

    await (new startStakeService({
      beneficiary: oThis.reserveAddr,
      to_stake_amount: oThis.amountToStakeInWeis,
      uuid: oThis.uuid
    })).perform();

    logger.info('* Waiting for credit of Branded Token to BT Reserve');
    await oThis._waitForBrandedTokenMint();

    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Get approval status
   *
   * @param {string} approveTransactionHash - transaction hash of the approval
   *
   * @return {promise}
   * * @private
   */
  _getApprovalStatus: function(approveTransactionHash) {
    return new Promise(function(onResolve, onReject) {

      const getStatus = async function(){

        const getApprovalStatusResponse = await (new getApprovalStatusService({
          transaction_hash: approveTransactionHash})).perform();

        if(getApprovalStatusResponse.isSuccess()){
          return onResolve(getApprovalStatusResponse);
        } else {
          setTimeout(getStatus, 10000);
        }
      };

      getStatus();
    });
  },

  /**
   * Wait for Branded Token mint
   *
   * @return {promise}
   * @private
   */
  _waitForBrandedTokenMint: function() {
    const oThis = this
    ;

    return new Promise(async function(onResolve, onReject) {

      const beforeBalanceResponse = await fundManager.getBrandedTokenBalanceOf(oThis.erc20Address, oThis.reserveAddr);
      const beforeBalance = new BigNumber(beforeBalanceResponse.data.balance);

      const getBalance = async function(){

        const afterBalanceResponse = await fundManager.getBrandedTokenBalanceOf(oThis.erc20Address, oThis.reserveAddr);

        if(afterBalanceResponse.isSuccess() && (new BigNumber(afterBalanceResponse.data.balance)).greaterThan(beforeBalance)){
          return onResolve(afterBalanceResponse);
        } else {
          setTimeout(getBalance, 10000);
        }
      };

      getBalance();
    });
  }
};

const args = process.argv
  , uuid = (args[2] || '').trim()
  , amountToStakeInWeis = (args[3] || '').trim()
;


tokenHelper.getBrandedToken(uuid).then(
  async function(btDetails){
    const btDetail = btDetails[uuid]
      , reserveAddr = btDetail.Reserve
      , reservePassphrase = btDetail.ReservePassphrase
      , erc20Addr = btDetail.ERC20
    ;

    const serviceObj = new MintBrandedToken({amount_to_stake_in_weis: amountToStakeInWeis, uuid: uuid, reserve_address: reserveAddr,
      reserve_passphrase: reservePassphrase, erc20_address: erc20Addr});
    await serviceObj.perform();

    if (process.env.OST_CACHING_ENGINE == 'none') {
      logger.info('Restful APIs need to be restarted as in-memory caching is used and branded tokens got minted.');
    }

    process.exit(0);
  }
);

