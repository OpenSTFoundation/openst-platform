'use strict';

/**
 * Deploy Utility Registrar Contract
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Deployment of utilityRegistrar Contract.</li>
 *   <li> Setting opsAddress of utilityRegistrar Contract to utilityRegistrar.</li>
 *   <li> Initiate OwnerShipTransfer of utilityRegistrar Contract to foundation.</li>
 * </ol>
 *
 * @module tools/deploy/utility_registrar
 */

const readline = require('readline');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  prompts = readline.createInterface(process.stdin, process.stdout);

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/tools/deploy/helper');
require(rootPrefix + '/lib/contract_interact/utility_registrar');

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function(compareWith) {
  const oThis = this,
    _self = this.toLowerCase(),
    _compareWith = String(compareWith).toLowerCase();

  return _self === _compareWith;
};

/**
 * Constructor for Deploy Utility Registrar contract
 *
 * @constructor
 */
const DeployUtilityRegistrarContractKlass = function(configStrategy, instanceComposer) {};

DeployUtilityRegistrarContractKlass.prototype = {
  /**
   * Perform
   *
   * @param {boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function(showPrompts) {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      UtilityRegistrarKlass = oThis.ic().getUtilityRegistrarClass(),
      deployHelper = oThis.ic().getDeployHelper(),
      utilityDeployerName = 'utilityDeployer',
      utilityRegistrarContractName = 'utilityRegistrar',
      utilityDeployerAddress = coreAddresses.getAddressForUser(utilityDeployerName),
      utilityRegistrarAddress = coreAddresses.getAddressForUser('utilityRegistrar'),
      foundationAddress = coreAddresses.getAddressForUser('foundation'),
      utilityRegistrarContractAbi = coreAddresses.getAbiForContract(utilityRegistrarContractName),
      utilityRegistrarContractBin = coreAddresses.getBinForContract(utilityRegistrarContractName),
      UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT,
      UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT,
      web3Provider = web3ProviderFactory.getProvider('utility', web3ProviderFactory.typeWS);

    logger.step('** Deploying utilityRegistrar Contract');
    if (showPrompts) {
      logger.info('Utility Chain Deployer Address: ' + utilityDeployerAddress);
      logger.info('Foundation Address: ' + foundationAddress);
      logger.info('Utility Chain Registrar User Address: ' + utilityRegistrarAddress);

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

    const utilityRegistrarContractDeployResult = await deployHelper.perform(
      utilityRegistrarContractName,
      web3Provider,
      utilityRegistrarContractAbi,
      utilityRegistrarContractBin,
      utilityDeployerName,
      { gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT }
    );

    logger.step('** Setting opsAddress of utilityRegistrar Contract to utilityRegistrar');
    const utilityRegistrarContractAddress = utilityRegistrarContractDeployResult.contractAddress,
      utilityRegistrar = new UtilityRegistrarKlass(utilityRegistrarContractAddress);

    await utilityRegistrar.setOpsAddress(utilityDeployerName, utilityRegistrarAddress, {
      gasPrice: UC_GAS_PRICE,
      gas: UC_GAS_LIMIT
    });

    const getOpsAddressResponse = await utilityRegistrar.getOpsAddress();

    if (!utilityRegistrarAddress.equalsIgnoreCase(getOpsAddressResponse.data.address)) {
      logger.error('Exiting the deployment as opsAddress of utilityRegistrar Contract does not match');
      process.exit(1);
    }

    logger.step('** Initiating OwnerShipTransfer of utilityRegistrar Contract to foundation');
    await utilityRegistrar.initiateOwnerShipTransfer(utilityDeployerName, foundationAddress, {
      gasPrice: UC_GAS_PRICE,
      gas: UC_GAS_LIMIT
    });

    const getOwnerResponse = await utilityRegistrar.getOwner();

    if (!foundationAddress.equalsIgnoreCase(getOwnerResponse.data.address)) {
      logger.error('Exiting the deployment as owner of utilityRegistrar Contract does not match');
      process.exit(1);
    }

    return Promise.resolve(
      responseHelper.successWithData({ contract: 'utilityRegistrar', address: utilityRegistrarContractAddress })
    );
  }
};

InstanceComposer.register(DeployUtilityRegistrarContractKlass, 'getUtilityRegistrarDeployer', true);

module.exports = DeployUtilityRegistrarContractKlass;
