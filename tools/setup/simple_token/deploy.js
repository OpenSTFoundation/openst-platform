"use strict";

/**
 * Deploy Simple Token Contract
 *
 * @module tools/setup/simple_token/deploy
 */

const rootPrefix = "../../.."
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

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
   * @return {promise<result>}
   */
  perform: async function () {
    const simpleTokenContractName = 'simpleToken'
      , simpleTokenContractAbi = coreAddresses.getAbiForContract(simpleTokenContractName)
      , simpleTokenContractBin = coreAddresses.getBinForContract(simpleTokenContractName)
    ;

    logger.step('** Deploying Simple Token Contract');
    const deploymentResult = await deployHelper.perform(
      simpleTokenContractName,
      web3ProviderFactory.getProvider('value','ws'),
      simpleTokenContractAbi,
      simpleTokenContractBin,
      'foundation');


    return Promise.resolve(responseHelper.successWithData(
      {contract: 'simpleToken', address: deploymentResult.contractAddress}));
  }
};

module.exports = new DeploySimpleTokenContractKlass();