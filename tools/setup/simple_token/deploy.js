"use strict";

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../../.."
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , setupFundManager = require(rootPrefix + '/tools/setup/fund_manager')
  , web3RpcValueProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;


const foundationAddr = coreAddresses.getAddressForUser('foundation')
  , foundationPassphrase = coreAddresses.getPassphraseForUser('foundation')
  , valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
  , valueDeployerAddr = coreAddresses.getAddressForUser('valueDeployer')
  , MIN_FUND = (new BigNumber(10)).toPower(18);


/**
 * Deploy Simple Token Contract
 *
 * @module tools/setup/simple_token/deploy
 */


/**
 * Constructor for Deploy simple token contract
 *
 * @constructor
 */
const DeploySimpleTokenContractKlass = function () {
};

DeploySimpleTokenContractKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise}
   */
  perform: async function () {
    const oThis = this
    ;

    logger.step("** Funding valueRegistrar and valueDeployer with ETH on value chain");
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueRegistrarAddr, MIN_FUND.toString(10));
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueDeployerAddr, MIN_FUND.toString(10));

    logger.step("** Deploying Simple Token Contract");
    const deploymentResult = await oThis.deploySimpleTokenContract();

    return Promise.resolve({simple_token_address: deploymentResult.contractAddress});
  },

  /**
   * Deploy Simple Token Contract
   *
   * @return {promise<object>}
   */
  deploySimpleTokenContract: function() {
    const oThis = this
      ,  contractName = 'simpleToken'
      , contractAbi = coreAddresses.getAbiForContract(contractName)
      , contractBin = coreAddresses.getBinForContract(contractName)
    ;

    return deployHelper.perform(
      contractName,
      web3RpcValueProvider,
      contractAbi,
      contractBin,
      'foundation');
  }

};

module.exports = new DeploySimpleTokenContractKlass();