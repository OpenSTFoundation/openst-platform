"use strict";

/**
 * Deploy Value Registrar Contract
 *
 * @module tools/deploy/valueRegistrar
 */

const readline = require('readline');

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , ValueRegistrarKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
;

const valueDeployerName = "valueDeployer"
  , valueRegistrarContractName = 'valueRegistrar'
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
  , deployerAddress = coreAddresses.getAddressForUser(valueDeployerName)
  , valueOpsAddress = coreAddresses.getAddressForUser("valueOps")
  , valueRegistrarContractAbi = coreAddresses.getAbiForContract(valueRegistrarContractName)
  , valueRegistrarContractBin = coreAddresses.getBinForContract(valueRegistrarContractName)
  , prompts = readline.createInterface(process.stdin, process.stdout)
;

/**
 * is equal ignoring case
 *
 * @param {String} compareWith - string to compare with
 *
 * @return {Bool} true when equal
 */
String.prototype.equalsIgnoreCase = function ( compareWith ) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self === _compareWith;
};


/**
 * Constructor for Deploy Value Registrar contract
 *
 * @constructor
 */
const DeployValueRegistrarContractKlass = function () {};

DeployValueRegistrarContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {Boolean} showPrompts - show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {
    logger.step('** Deploying Value Registrar Contract');
    if (showPrompts) {
      // confirming the important addresses
      logger.info("Deployer Address: " + deployerAddress);
      logger.info("Value Ops Address: " + valueOpsAddress);

      await new Promise(
        function (onResolve, onReject) {
          prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
            if ((intent != 'n') && (intent != 'N')) {
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

    const contractDeployTxReceipt = await deployHelper.perform(valueRegistrarContractName, web3Provider,
      valueRegistrarContractAbi, valueRegistrarContractBin, valueDeployerName, {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT});

    const valueRegistrarContractAddr = contractDeployTxReceipt.contractAddress;

    logger.step('** Setting Ops Address of Value Registrar contract to valueOps address and verifying it');
    const valueRegistrar = new ValueRegistrarKlass(valueRegistrarContractAddr);
    await valueRegistrar.setOpsAddress(valueDeployerName, valueOpsAddress);

    const getOpsAddressResponse = await valueRegistrar.getOpsAddress();

    if (!valueOpsAddress.equalsIgnoreCase(getOpsAddressResponse.data.address)) {
      logger.error('Exiting the deployment as opsAddress which was set just before does not match.');
      process.exit(0);
    }

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'valueRegistrar', address: valueRegistrarContractAddr}));
  }
};

module.exports = new DeployValueRegistrarContractKlass();