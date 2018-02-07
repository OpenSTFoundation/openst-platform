"use strict";

/**
 * Deploy Utility Registrar Contract
 *
 * @module tools/deploy/utility_registrar
 */

const readline = require('readline')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , UtilityRegistrarKlass = require(rootPrefix + '/lib/contract_interact/utility_registrar')
;

const utilityDeployerName = 'utilityDeployer'
  , utilityRegistrarContractName = 'utilityRegistrar'
  , utilityDeployerAddress = coreAddresses.getAddressForUser(utilityDeployerName)
  , utilityRegistrarAddress = coreAddresses.getAddressForUser('utilityRegistrar')
  , foundationAddress = coreAddresses.getAddressForUser("foundation")
  , utilityRegistrarContractAbi = coreAddresses.getAbiForContract(utilityRegistrarContractName)
  , utilityRegistrarContractBin = coreAddresses.getBinForContract(utilityRegistrarContractName)
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
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
 * Constructor for Deploy Utility Registrar contract
 *
 * @constructor
 */
const DeployUtilityRegistrarContractKlass = function () {};

DeployUtilityRegistrarContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {

    logger.step('** Deploying utilityRegistrar Contract');
    if (showPrompts) {
      logger.info("Utility Chain Deployer Address: " + utilityDeployerAddress);
      logger.info("Foundation Address: " + foundationAddress);
      logger.info("Utility Chain Registrar User Address: " + utilityRegistrarAddress);

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

    const utilityRegistrarContractDeployResult = await deployHelper.perform(utilityRegistrarContractName, web3Provider,
      utilityRegistrarContractAbi, utilityRegistrarContractBin, utilityDeployerName,
      {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT});

    logger.step('** Setting opsAddress of utilityRegistrar Contract to utilityRegistrar');
    const utilityRegistrarContractAddress = utilityRegistrarContractDeployResult.contractAddress
      , utilityRegistrar = new UtilityRegistrarKlass(utilityRegistrarContractAddress);

    await utilityRegistrar.setOpsAddress(utilityDeployerName, utilityRegistrarAddress,
      {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT});

    const getOpsAddressResponse = await utilityRegistrar.getOpsAddress();

    if (!utilityRegistrarAddress.equalsIgnoreCase(getOpsAddressResponse.data.address)) {
      logger.error('Exiting the deployment as opsAddress of utilityRegistrar Contract does not match');
      process.exit(1);
    }

    logger.step('** Initiating OwnerShipTransfer of utilityRegistrar Contract to foundation');
    await utilityRegistrar.initiateOwnerShipTransfer(utilityDeployerName, foundationAddress,
      {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT});

    const getOwnerResponse = await utilityRegistrar.getOwner();

    if (!foundationAddress.equalsIgnoreCase(getOwnerResponse.data.address)) {
      logger.error('Exiting the deployment as owner of utilityRegistrar Contract does not match');
      process.exit(1);
    }

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'utilityRegistrar', address: utilityRegistrarContractAddress}));
  }
};

module.exports = new DeployUtilityRegistrarContractKlass();