'use strict';

/**
 * Deploy Value Registrar Contract
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Deployment of valueRegistrar Contract.</li>
 *   <li> Setting Ops Address of Value Registrar contract to valueOps address and verifying it.</li>
 * </ol>
 *
 * @module tools/deploy/value_registrar
 */

const readline = require('readline');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  prompts = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/tools/deploy/helper');
require(rootPrefix + '/lib/contract_interact/value_registrar');

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {boolean} true when equal
 */
String.prototype.equalsIgnoreCase = function(compareWith) {
  const oThis = this,
    _self = this.toLowerCase(),
    _compareWith = String(compareWith).toLowerCase();

  return _self === _compareWith;
};

/**
 * Constructor for Deploy Value Registrar contract
 *
 * @constructor
 */
const DeployValueRegistrarContractKlass = function(configStrategy, instanceComposer) {};

DeployValueRegistrarContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {boolean} showPrompts - show prompts
   *
   * @return {promise<result>}
   */
  perform: async function(showPrompts) {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      ValueRegistrarKlass = oThis.ic().getValueRegistrarInteractClass(),
      deployHelper = oThis.ic().getDeployHelper(),
      valueDeployerName = 'valueDeployer',
      valueRegistrarUserName = 'valueRegistrar',
      valueRegistrarContractName = 'valueRegistrar',
      foundationName = 'foundation',
      VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE,
      VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT,
      deployerAddress = coreAddresses.getAddressForUser(valueDeployerName),
      valueRegistrarUserAddress = coreAddresses.getAddressForUser(valueRegistrarUserName),
      foundationAddress = coreAddresses.getAddressForUser(foundationName),
      valueRegistrarContractAbi = coreAddresses.getAbiForContract(valueRegistrarContractName),
      valueRegistrarContractBin = coreAddresses.getBinForContract(valueRegistrarContractName),
      web3Provider = web3ProviderFactory.getProvider('value', web3ProviderFactory.typeWS);

    logger.step('** Deploying Value Registrar Contract');
    if (showPrompts) {
      // confirming the important addresses
      logger.info('Deployer Address: ' + deployerAddress);
      logger.info('Value Registrar Address: ' + valueRegistrarUserAddress);

      await new Promise(function(onResolve, onReject) {
        prompts.question('Please verify all above details. Do you want to proceed? [Y/N]', function(intent) {
          if (intent === 'Y' || intent === 'y') {
            logger.info('Great! Proceeding deployment.');
            prompts.close();
            onResolve();
          } else {
            logger.error('Exiting deployment scripts. Change the env vars and re-run.');
            process.exit(1);
          }
        });
      });
    } else {
      prompts.close();
    }

    const contractDeployTxReceipt = await deployHelper.perform(
      valueRegistrarContractName,
      web3Provider,
      valueRegistrarContractAbi,
      valueRegistrarContractBin,
      valueDeployerName,
      {
        gasPrice: VC_GAS_PRICE,
        gas: VC_GAS_LIMIT
      }
    );

    const valueRegistrarContractAddr = contractDeployTxReceipt.contractAddress;

    logger.step('** Setting Ops Address of Value Registrar contract to Value Registrar user address and verifying it');
    const valueRegistrar = new ValueRegistrarKlass(valueRegistrarContractAddr);
    await valueRegistrar.setOpsAddress(valueDeployerName, valueRegistrarUserAddress, {});

    const getOpsAddressResponse = await valueRegistrar.getOpsAddress();

    if (!valueRegistrarUserAddress.equalsIgnoreCase(getOpsAddressResponse.data.address)) {
      logger.error('Exiting the deployment as opsAddress which was set just before does not match.');
      process.exit(1);
    }

    logger.step('** Initiate Ownership Transfer of Value Registrar contract to foundation');
    await valueRegistrar.initiateOwnerShipTransfer(valueDeployerName, foundationAddress, {});

    const getOwnerResponse = await valueRegistrar.getOwner();

    if (!foundationAddress.equalsIgnoreCase(getOwnerResponse.data.address)) {
      logger.error("Exiting the deployment as owner address doesn't match");
      process.exit(1);
    }

    return Promise.resolve(
      responseHelper.successWithData({ contract: 'valueRegistrar', address: valueRegistrarContractAddr })
    );
  }
};

InstanceComposer.register(DeployValueRegistrarContractKlass, 'getDeployValueRegistrarContract', true);

module.exports = DeployValueRegistrarContractKlass;
