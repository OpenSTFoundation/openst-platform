'use strict';

/**
 * Stake and mint Branded Token
 *
 * @module tools/setup/branded_token/mint
 */

const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenHelper = require(rootPrefix + '/tools/setup/branded_token/helper'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/services/stake_and_mint/start_stake');
require(rootPrefix + '/tools/setup/fund_manager');
require(rootPrefix + '/lib/contract_interact/branded_token');

/**
 * Constructor for Mint Branded Token
 *
 * @constructor
 */
const MintBrandedToken = function(params) {
  const oThis = this;

  oThis.brandedTokenUuid = params.uuid;
  oThis.amountToStakeInWeis = params.amount_to_stake_in_weis;
  oThis.reserveAddr = params.reserve_address;
  oThis.reservePassphrase = params.reserve_passphrase;
  oThis.erc20Address = params.erc20_address;
  oThis.config_strategy_file_path = params.config_strategy_file_path;

  let configStrategy = oThis.config_strategy_file_path
    ? require(oThis.config_strategy_file_path)
    : require(setupHelper.configStrategyFilePath());

  oThis.ic = new InstanceComposer(configStrategy);

};

MintBrandedToken.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function() {
    const oThis = this,
      coreConstants = oThis.ic.getCoreConstants(),
      coreAddresses = oThis.ic.getCoreAddresses();

    // validations
    if (!basicHelper.isNonZeroWeiValid(oThis.amountToStakeInWeis)) {
      logger.error('Invalid amount');
      process.exit(1);
    }

    // Format to big number
    oThis.amountToStakeInWeis = basicHelper.convertToBigNumber(oThis.amountToStakeInWeis);

    const amountToStakeForBT = oThis.amountToStakeInWeis.mul(0.9).minus(oThis.amountToStakeInWeis.mul(0.9).modulo(1)),
      amountToStakeForSTP = oThis.amountToStakeInWeis.minus(amountToStakeForBT),
      stPrimeUuid = coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID;

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

    const stakerAddr = coreAddresses.getAddressForUser('staker'),
      foundationAddr = coreAddresses.getAddressForUser('foundation'),
      foundationPassphrase = coreAddresses.getPassphraseForUser('foundation'),
      fundManager = oThis.ic.getSetupFundManager();

    await fundManager.transferST(foundationAddr, foundationPassphrase, stakerAddr, oThis.amountToStakeInWeis, {
      tag: 'transferSTToBTReserve',
      returnType: 'txReceipt'
    });

    const approveService = oThis.ic.getApproveOpenstValueContractService();

    logger.info('* Staker approves openSTValue contract');
    const approveResponse = await new approveService().perform();
    if (approveResponse.isFailure()) {
      process.exit(1);
    }

    const approveTransactionHash = approveResponse.data.transaction_hash;

    logger.info('* Get approval status and keep doing so till success');

    const web3ProviderFactory = oThis.ic.getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
      contractInteractHelper = oThis.ic.getContractInteractHelper();

    const approveReceiptResponse = await contractInteractHelper.waitAndGetTransactionReceipt(
      web3Provider,
      approveTransactionHash,
      {}
    );
    if (!approveReceiptResponse.isSuccess()) {
      logger.error('Approval receipt error ', approveReceiptResponse);
      process.exit(1);
    }

    const startStakeService = oThis.ic.getStartStakeService();

    logger.info('* Start stake for Branded Token');
    await new startStakeService({
      beneficiary: oThis.reserveAddr,
      to_stake_amount: amountToStakeForBT,
      uuid: oThis.brandedTokenUuid
    }).perform();

    logger.info('* Waiting for credit of Branded Token to BT Reserve');
    await oThis._waitForBrandedTokenMint();

    logger.info('* Start stake for Simple Token Prime');
    await new startStakeService({
      beneficiary: oThis.reserveAddr,
      to_stake_amount: amountToStakeForSTP,
      uuid: stPrimeUuid
    }).perform();

    logger.info('* Waiting for credit of Simple Token Prime to BT Reserve');
    await oThis._waitForSimpleTokenPrimeMint();

    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Wait for Branded Token mint
   *
   * @return {promise}
   * @private
   */
  _waitForBrandedTokenMint: function() {
    const oThis = this;

    return new Promise(async function(onResolve, onReject) {
      // NOTE: NOT Relying on CACHE - this is because for in process memory, this goes into infinite loop
      const BrandedTokenKlass = oThis.ic.getBrandedTokenInteractClass(),
        brandedToken = new BrandedTokenKlass({ ERC20: oThis.erc20Address });

      const beforeBalanceResponse = await brandedToken._callMethod('balanceOf', [oThis.reserveAddr]);
      const beforeBalance = new BigNumber(beforeBalanceResponse.data.balanceOf);

      logger.info('Balance of Reserve for Branded Token before mint:', beforeBalance.toString(10));

      const getBalance = async function() {
        const afterBalanceResponse = await brandedToken._callMethod('balanceOf', [oThis.reserveAddr]),
          afterBalance = afterBalanceResponse.data.balanceOf;

        if (afterBalanceResponse.isSuccess() && new BigNumber(afterBalance).greaterThan(beforeBalance)) {
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
    const oThis = this,
      web3ProviderFactory = oThis.ic.getWeb3ProviderFactory(),
      web3UcProvider = web3ProviderFactory.getProvider('utility', 'ws');

    return new Promise(async function(onResolve, onReject) {
      const beforeBalance = new BigNumber(await web3UcProvider.eth.getBalance(oThis.reserveAddr));

      logger.info('Balance of Reserve for Simple Token Prime before mint:', beforeBalance.toString(10));

      const getBalance = async function() {
        const afterBalance = new BigNumber(await web3UcProvider.eth.getBalance(oThis.reserveAddr));

        if (new BigNumber(afterBalance).greaterThan(beforeBalance)) {
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

const args = process.argv,
  symbol = (args[2] || '').trim(),
  amountToStakeInWeis = (args[3] || '').trim(),
  configStrategyFilePath = (args[4] || '').trim()
;

tokenHelper
  .getBrandedToken()
  .then(function(btDetails) {
    var selectedBtDetail = null;
    for (var uuid in btDetails) {
      const currBtDetail = btDetails[uuid];

      if (currBtDetail.Symbol.toLowerCase() == symbol.toLowerCase()) {
        selectedBtDetail = currBtDetail;
      }
    }

    if (!selectedBtDetail) {
      logger.error('Invalid Branded Token Symbol:', symbol);
      process.exit(1);
    }

    return selectedBtDetail;
  })
  .then(async function(selectedBtDetail) {
    const reserveAddr = selectedBtDetail.Reserve,
      reservePassphrase = selectedBtDetail.ReservePassphrase,
      erc20Addr = selectedBtDetail.ERC20,
      uuid = selectedBtDetail.UUID;

    const serviceObj = new MintBrandedToken({
      amount_to_stake_in_weis: amountToStakeInWeis,
      uuid: uuid,
      reserve_address: reserveAddr,
      reserve_passphrase: reservePassphrase,
      erc20_address: erc20Addr,
      config_strategy_file_path: configStrategyFilePath
    });

    await serviceObj.perform();

    if (process.env.OST_CACHING_ENGINE == 'none') {
      logger.error(Array(30).join('='));
      logger.error('Restful APIs need to be restarted as in-memory caching is used and branded tokens got minted.');
      logger.error(Array(30).join('='));
    }

    process.exit(0);
  });
