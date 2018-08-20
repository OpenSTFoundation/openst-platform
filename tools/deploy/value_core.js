'use strict';

/**
 * Deploy value core contract
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Deployment of valueCore Contract.</li>
 *   <li> Calling addCore of Value Registrar Contract.</li>
 * </ol>
 *
 * @module tools/deploy/value_core
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
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function(compareWith) {
  const oThis = this,
    _self = this.toLowerCase(),
    _compareWith = String(compareWith).toLowerCase();

  return _self === _compareWith;
};

/**
 * Constructor for Deploy Value Core contract
 *
 * @constructor
 */
const DeployValueCoreContractKlass = function(configStrategy, instanceComposer) {};

DeployValueCoreContractKlass.prototype = {
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
      ValueRegistrarKlass = oThis.ic().getValueRegistrarInteractClass(),
      deployHelper = oThis.ic().getDeployHelper(),
      valueDeployerName = 'valueDeployer',
      valueRegistrarUserName = 'valueRegistrar',
      openSTValueContractName = 'openSTValue',
      openSTUtilityContractName = 'openSTUtility',
      valueRegistrarContractName = 'valueRegistrar',
      valueCoreContractName = 'valueCore',
      VALUE_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE,
      VALUE_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT,
      VALUE_CHAIN_ID = coreConstants.OST_VALUE_CHAIN_ID,
      UTILITY_CHAIN_ID = coreConstants.OST_UTILITY_CHAIN_ID,
      valueRegistrarUserAddress = coreAddresses.getAddressForUser(valueRegistrarUserName),
      valueDeployerAddress = coreAddresses.getAddressForUser(valueDeployerName),
      valueRegistrarContractAddress = coreAddresses.getAddressForContract(valueRegistrarContractName),
      openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName),
      openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName),
      valueCoreContractAbi = coreAddresses.getAbiForContract(valueCoreContractName),
      valueCoreContractBin = coreAddresses.getBinForContract(valueCoreContractName),
      valueRegistrar = new ValueRegistrarKlass(valueRegistrarContractAddress),
      web3Provider = web3ProviderFactory.getProvider('value', web3ProviderFactory.typeWS);

    logger.step('** Deploying valueCore Contract');
    if (showPrompts) {
      // confirming the important addresses
      logger.info('Deployer User Address: ' + valueDeployerAddress);
      logger.info('Value Registrar User Address: ' + valueRegistrarUserAddress);
      logger.info('Value Registrar Contract Address: ' + valueRegistrarContractAddress);
      logger.info('OpenST Utility Contract Address: ' + openSTUtilityContractAddress);
      logger.info('OpenST Value Contract Address: ' + openSTValueContractAddress);

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

    const valueCoreContractDeployResponse = await deployHelper.perform(
      valueCoreContractName,
      web3Provider,
      valueCoreContractAbi,
      valueCoreContractBin,
      valueDeployerName,
      { gasPrice: VALUE_GAS_PRICE, gas: VALUE_GAS_LIMIT },
      [valueRegistrarContractAddress, VALUE_CHAIN_ID, UTILITY_CHAIN_ID, openSTUtilityContractAddress]
    );

    const valueCoreContractAddress = valueCoreContractDeployResponse.contractAddress;

    logger.step('** Calling addCore of Value Registrar Contract');
    await valueRegistrar.addCore(valueRegistrarUserName, openSTValueContractAddress, valueCoreContractAddress);

    return Promise.resolve(
      responseHelper.successWithData({ contract: 'valueCore', address: valueCoreContractAddress })
    );
  }
};

InstanceComposer.register(DeployValueCoreContractKlass, 'getValueCoreDeployer', true);

module.exports = DeployValueCoreContractKlass;
