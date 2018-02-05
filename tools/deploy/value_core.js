"use strict";

const readline = require('readline')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , ValueRegistrarKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
;

const valueDeployerName = 'valueDeployer'
  , valueOpsName = 'valueOps'
  , openSTValueContractName = 'openSTValue'
  , openSTUtilityContractName = 'openSTUtility'
  , valueRegistrarContractName = 'valueRegistrar'
  , valueCoreContractName = 'valueCore'
  , VALUE_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VALUE_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
  , VALUE_CHAIN_ID = coreConstants.OST_VALUE_CHAIN_ID
  , UTILITY_CHAIN_ID = coreConstants.OST_UTILITY_CHAIN_ID
  , valueOpsAddress = coreAddresses.getAddressForUser(valueOpsName)
  , valueDeployerAddress = coreAddresses.getAddressForUser(valueDeployerName)
  , valueRegistrarContractAddress = coreAddresses.getAddressForContract(valueRegistrarContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , valueCoreContractAbi = coreAddresses.getAbiForContract(valueCoreContractName)
  , valueCoreContractBin = coreAddresses.getBinForContract(valueCoreContractName)
  , valueRegistrar = new ValueRegistrarKlass(valueRegistrarContractAddress)
  , prompts = readline.createInterface(process.stdin, process.stdout)
;

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function ( compareWith ) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self === _compareWith;
};

/**
 * Constructor for Deploy Value Core contract
 *
 * @constructor
 */
const DeployValueCoreContractKlass = function () {};

DeployValueCoreContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {Boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {
    logger.step('** Deploying valueCore Contract');
    if (showPrompts) {
      // confirming the important addresses
      logger.info("Deployer Address: " + valueDeployerAddress);
      logger.info("Value Ops Address: " + valueOpsAddress);
      logger.info("Value Registrar Contract: " + valueRegistrarContractAddress);
      logger.info("OpenST Utility Contract: " + openSTUtilityContractAddress);
      logger.info("OpenST Value Contract: " + openSTValueContractAddress);

      await new Promise(
        function (onResolve, onReject) {
          prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
            if ((intent === 'Y') || (intent === 'y')) {
              logger.info('Great! Proceeding deployment.');
              prompts.close();
              onResolve();
            } else {
              logger.error('Exiting deployment scripts. Change the env vars and re-run.');
              process.exit(1);
            }
          });
        }
      );
    } else {
      prompts.close();
    }

    const valueCoreContractDeployResponse = await deployHelper.perform(valueCoreContractName, web3Provider,
      valueCoreContractAbi, valueCoreContractBin, valueDeployerName, {gasPrice: VALUE_GAS_PRICE, gas: VALUE_GAS_LIMIT},
      [valueRegistrarContractAddress, VALUE_CHAIN_ID, UTILITY_CHAIN_ID, openSTUtilityContractAddress]);

    const valueCoreContractAddress = valueCoreContractDeployResponse.contractAddress;

    logger.step('** Calling addCore of Value Registrar Contract');
    await valueRegistrar.addCore(valueOpsName, openSTValueContractAddress, valueCoreContractAddress);

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'valueCore', address: valueCoreContractAddress}));
  }
};

module.exports = new DeployValueCoreContractKlass();