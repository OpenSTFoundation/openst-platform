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
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , approveService = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  , getApprovalStatusService = require(rootPrefix + '/services/stake_and_mint/get_approval_status')
  , startStakeService = require(rootPrefix + '/services/stake_and_mint/start_stake')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , tokenHelper = require(rootPrefix + '/tools/setup/branded_token/helper')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
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

  oThis.brandedTokenUuid = params.uuid;
  oThis.amountToStakeInWeis = params.amount_to_stake_in_weis;
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

    // validations
    if (!basicHelper.isNonZeroWeiValid(oThis.amountToStakeInWeis)) {
      logger.error('Invalid amount');
      process.exit(1);
    }

    // Format to big number
    oThis.amountToStakeInWeis = basicHelper.convertToBigNumber(oThis.amountToStakeInWeis);

    const amountToStakeForBT = (oThis.amountToStakeInWeis.mul(0.9) - oThis.amountToStakeInWeis.mul(0.9).modulo(1))
      , amountToStakeForSTP = oThis.amountToStakeInWeis.minus(amountToStakeForBT)
      , stPrimeUuid = coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID
    ;

    // validations
    if (!basicHelper.isNonZeroWeiValid(amountToStakeForBT)) {
      logger.error('Invalid wei amount to stake for BT', amountToStakeForBT.toString(10));
      process.exit(1);
    }
    if (!basicHelper.isNonZeroWeiValid(amountToStakeForSTP)) {
      logger.error('Invalid wei amount to stake for ST Prime', amountToStakeForSTP.toString(10));
      process.exit(1);
    }

    logger.step('** Starting stake mint for branded token for beneficiary reserve of BT Reserve:', oThis.reserveAddr);

    // NOTE: In real case, Member Company transfers ST to staker and then approve is called. To simulate this, foundation
    // is transfering ST to staker.
    logger.info('* Foundation transfers ST to BT Reserve');
    await fundManager.transferST(
        foundationAddr, foundationPassphrase, stakerAddr, oThis.amountToStakeInWeis,
        {tag: 'transferSTToBTReserve', returnType: 'txReceipt'}
    );

    logger.info('* Staker approves openSTValue contract');
    const approveResponse = await (new approveService()).perform();
    if (approveResponse.isFailure()) {
      process.exit(1);
    }

    const approveTransactionHash = approveResponse.data.transaction_hash;

    logger.info('* Get approval status and keep doing so till success');
    await oThis._getApprovalStatus(approveTransactionHash);

    logger.info('* Start stake for Branded Token');
    await (new startStakeService({
      beneficiary: oThis.reserveAddr,
      to_stake_amount: amountToStakeForBT,
      uuid: oThis.brandedTokenUuid
    })).perform();

    logger.info('* Waiting for credit of Branded Token to BT Reserve');
    await oThis._waitForBrandedTokenMint();

    logger.info('* Start stake for Simple Token Prime');
    await (new startStakeService({
      beneficiary: oThis.reserveAddr,
      to_stake_amount: amountToStakeForSTP,
      uuid: stPrimeUuid
    })).perform();

    logger.info('* Waiting for credit of Simple Token Prime to BT Reserve');
    await oThis._waitForSimpleTokenPrimeMint();

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

      // NOTE: NOT Relying on CACHE - this is because for in process memory, this goes into infinite loop
      const BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
        , brandedToken = new BrandedTokenKlass({ERC20: oThis.erc20Address, Reserve: oThis.reserveAddr});

      const beforeBalanceResponse = await brandedToken._callMethod('balanceOf', [oThis.reserveAddr]);
      const beforeBalance = new BigNumber(beforeBalanceResponse.data.balanceOf);

      logger.info('Balance of Reserve for Branded Token before mint:', beforeBalance.toString(10));

      const getBalance = async function(){

        const afterBalanceResponse = await brandedToken._callMethod('balanceOf', [oThis.reserveAddr])
          , afterBalance = afterBalanceResponse.data.balanceOf;

        if(afterBalanceResponse.isSuccess() && (new BigNumber(afterBalance)).greaterThan(beforeBalance)){
          logger.info('Balance of Reserve for Branded Token after mint:', afterBalance.toString(10));
          return onResolve();
        } else {
          setTimeout(getBalance, 5000);
        }
      };

      getBalance();
    });
  },

  /**
   * Wait for Simple Token Prime mint
   *
   * @return {promise}
   * @private
   */
  _waitForSimpleTokenPrimeMint: function() {
    const oThis = this
      , web3RpcProvider = web3ProviderFactory.getProvider('utility', 'rpc')
    ;

    return new Promise(async function(onResolve, onReject) {

      const beforeBalance = new BigNumber(await web3RpcProvider.eth.getBalance(oThis.reserveAddr));

      logger.info('Balance of Reserve for Simple Token Prime before mint:', beforeBalance.toString(10));

      const getBalance = async function(){

        const afterBalance = new BigNumber(await web3RpcProvider.eth.getBalance(oThis.reserveAddr));

        if((new BigNumber(afterBalance)).greaterThan(beforeBalance)){
          logger.info('Balance of Reserve for Simple Token Prime after mint:', afterBalance.toString(10));
          return onResolve();
        } else {
          setTimeout(getBalance, 5000);
        }
      };

      getBalance();
    });
  }
};

const args = process.argv
  , symbol = (args[2] || '').trim()
  , amountToStakeInWeis = (args[3] || '').trim()
;

tokenHelper.getBrandedToken()
  .then(function(btDetails){
    var selectedBtDetail = null;
    for (var uuid in btDetails) {
      const currBtDetail = btDetails[uuid];

      if (currBtDetail.Symbol.toLowerCase() == symbol.toLowerCase()) {
        selectedBtDetail = currBtDetail;
      }
    }

    if(!selectedBtDetail) {
      logger.error('Invalid Branded Token Symbol:', symbol);
      process.exit(1);
    }

    return selectedBtDetail;
  })
  .then(async function(selectedBtDetail){
    const reserveAddr = selectedBtDetail.Reserve
      , reservePassphrase = selectedBtDetail.ReservePassphrase
      , erc20Addr = selectedBtDetail.ERC20
      , uuid = selectedBtDetail.UUID
    ;

    const serviceObj = new MintBrandedToken({amount_to_stake_in_weis: amountToStakeInWeis, uuid: uuid,
      reserve_address: reserveAddr, reserve_passphrase: reservePassphrase, erc20_address: erc20Addr});

    await serviceObj.perform();

    if (process.env.OST_CACHING_ENGINE == 'none') {
      logger.error(Array(30).join("="));
      logger.error('Restful APIs need to be restarted as in-memory caching is used and branded tokens got minted.');
      logger.error(Array(30).join("="));
    }

    process.exit(0);
  }
);

