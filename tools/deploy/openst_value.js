"use strict";

/**
 * Deploy openST Value Contract
 *
 * @module tools/deploy/openst_value
 */

const readline = require('readline');

const rootPrefix = '../..'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
;

// Different addresses used for deployment
const valueDeployerName = "valueDeployer"
  , openSTValueContractName = 'openSTValue'
  , VALUE_CHAIN_ID = coreConstants.OST_VALUE_CHAIN_ID
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
  , deployerAddress = coreAddresses.getAddressForUser(valueDeployerName)
  , foundationAddress = coreAddresses.getAddressForUser("foundation")
  , valueOpsAddress = coreAddresses.getAddressForUser("valueOps")
  , simpleTokenContractAddress = coreAddresses.getAddressForContract("simpleToken")
  , valueRegistrarContractAddress = coreAddresses.getAddressForContract("valueRegistrar")
  , openSTValueContractAbi = coreAddresses.getAbiForContract(openSTValueContractName)
  , openSTValueContractBin = coreAddresses.getBinForContract(openSTValueContractName)
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
 * Constructor for Deploy OpenST Value contract
 *
 * @constructor
 */
const DeployOpenSTValueContractKlass = function () {};

DeployOpenSTValueContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {Boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {
    logger.step('** Deploying openSTValue Contract');
    if (showPrompts) {
      // confirming the important addresses
      logger.info('Simple Token Contract Address: ' + simpleTokenContractAddress);
      logger.info('Value Registrar Contract Address: ' + valueRegistrarContractAddress);
      logger.info('Deployer Address: ' + deployerAddress);
      logger.info('Foundation Address: ' + foundationAddress);
      logger.info('Value Ops Address: ' + valueOpsAddress);

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

    const contractDeployTxReceipt = await deployHelper.perform(openSTValueContractName, web3Provider, openSTValueContractAbi,
      openSTValueContractBin, valueDeployerName, {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT},
      [VALUE_CHAIN_ID, simpleTokenContractAddress, valueRegistrarContractAddress]);

    const openSTValueContractAddress = contractDeployTxReceipt.contractAddress;

    const openstValueContract = new OpenSTValueKlass(openSTValueContractAddress);

    logger.step('** initiateOwnerShipTransfer of openSTValue Contract');
    await openstValueContract.initiateOwnerShipTransfer(valueDeployerName, foundationAddress, {});

    const getOwnerResponse = await openstValueContract.getOwner();

    if (!foundationAddress.equalsIgnoreCase(getOwnerResponse.data.address)) {
      logger.error('Exiting the deployment as owner of openSTValue Contract does not match');
      process.exit(1);
    }

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'openSTValue', address: openSTValueContractAddress}));
  }
};

module.exports = new DeployOpenSTValueContractKlass();