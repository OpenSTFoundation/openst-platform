"use strict";

/**
 * Deploy Simple Token Contract
 *
 * @module tools/setup/simple_token/deploy
 */

const rootPrefix = "../../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;

require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/tools/deploy/helper');


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
    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
      , simpleTokenContractName = 'simpleToken'
      , simpleTokenContractAbi = coreAddresses.getAbiForContract(simpleTokenContractName)
      , simpleTokenContractBin = coreAddresses.getBinForContract(simpleTokenContractName)
      , web3ValueProvider = oThis.ic().getWeb3ProviderFactory().getProvider('value', 'ws')
      , deployHelper = oThis.ic().getDeployHelper()
    ;

    logger.step('** Deploying Simple Token Contract');
    const deploymentResult = await deployHelper.perform(
      simpleTokenContractName,
      web3ValueProvider,
      simpleTokenContractAbi,
      simpleTokenContractBin,
      'foundation');


    return Promise.resolve(responseHelper.successWithData(
      {contract: 'simpleToken', address: deploymentResult.contractAddress}));
  }
};

InstanceComposer.register(DeploySimpleTokenContractKlass, 'getSimpleTokenContract', false);

module.exports = DeploySimpleTokenContractKlass;