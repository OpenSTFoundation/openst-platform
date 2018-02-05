"use strict";

/**
 * Deploy openST Value Contract
 *
 * @module tools/deploy/openst_utility
 */

const readline = require('readline')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const utilityDeployerName = 'utilityDeployer'
  , utilityRegistrarContractName = 'utilityRegistrar'
  , openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
  , openSTUtilityContractBin = coreAddresses.getBinForContract(openSTUtilityContractName)
  , utilityDeployerAddress = coreAddresses.getAddressForUser(utilityDeployerName)
  , foundationAddress = coreAddresses.getAddressForUser("foundation")
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract(utilityRegistrarContractName)
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
  , VALUE_CHAIN_ID = coreConstants.OST_VALUE_CHAIN_ID
  , UTILITY_CHAIN_ID = coreConstants.OST_UTILITY_CHAIN_ID
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
const DeployOpenSTUtilityContractKlass = function () {};

DeployOpenSTUtilityContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {Boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {

    logger.step('** Deploying OpenST Utility Contract');
    if (showPrompts) {
      logger.info('Utility Chain Deployer Address: ' + utilityDeployerAddress);
      logger.info('Value Chain ID: ' + VALUE_CHAIN_ID);
      logger.info('Utility Chain ID: ' + UTILITY_CHAIN_ID);
      logger.info('Foundation Address: ' + foundationAddress);

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

    const openSTUtiltiyContractDeployResponse = await deployHelper.perform(openSTUtilityContractName,
      web3Provider, openSTUtilityContractAbi, openSTUtilityContractBin, utilityDeployerName,
      {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT}, [VALUE_CHAIN_ID, UTILITY_CHAIN_ID, utilityRegistrarContractAddress]
    );

    const openSTUtilityContractAddress = openSTUtiltiyContractDeployResponse.contractAddress
      , openStUtility = new OpenStUtilityKlass(openSTUtilityContractAddress);

    logger.step('** Initiating OwnerShipTransfer of openSTUtility Contract to foundation');

    const initiateOwnershipTransferResponse = await openStUtility.initiateOwnerShipTransfer(utilityDeployerName,
      foundationAddress, {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT});

    const getOwnerResponse = await openStUtility.getOwner();

    if (!foundationAddress.equalsIgnoreCase(getOwnerResponse.data.address)) {
      logger.error('Exiting the deployment as owner of openSTUtility Contract does not match');
      process.exit(1);
    }

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'openSTUtility', address: openSTUtilityContractAddress}));
  }
};

module.exports = new DeployOpenSTUtilityContractKlass();