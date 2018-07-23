"use strict";

/**
 * Register ST Prime
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Deployment of valueCore Contract.</li>
 *   <li> Calling of addCore of Value Registrar Contract.</li>
 *   <li> Calling of registerUtilityToken of valueRegistrar Contract for ST Prime.</li>
 *   <li> Setting Ops Address of valueRegistrar Contract to valueRegistrar User.</li>
 * </ol>
 *
 * @module tools/deploy/register_st_prime
 */

const readline = require('readline')
;

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/openst_utility');
require(rootPrefix + '/lib/contract_interact/value_registrar');

/**
 * Constructor for Deploy Value Core contract
 *
 * @constructor
 */
const RegisterStPrimeKlass = function (configStrategy, instanceComposer) {

};

RegisterStPrimeKlass.prototype = {
  /**
   * Perform
   *
   * @param {boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {
    
    const oThis = this
      , coreConstants = oThis.ic().getCoreConstants()
      , coreAddresses = oThis.ic().getCoreAddresses()
      , OpenStUtilityKlass = oThis.ic().getOpenSTUtilityInteractClass()
      , ValueRegistrarKlass = oThis.ic().getValueRegistrarInteractClass()
      , valueDeployerName = 'valueDeployer'
      , valueOpsName = 'valueOps'
      , valueRegistrarUserName = 'valueRegistrar'
      , foundationName = 'foundation'
      , openSTValueContractName = 'openSTValue'
      , openSTUtilityContractName = 'openSTUtility'
      , valueRegistrarContractName = 'valueRegistrar'
      , UTILITY_CHAIN_ID = coreConstants.OST_UTILITY_CHAIN_ID
      , stPrimeUUID = coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID
      , valueRegistrarUser = coreAddresses.getAddressForUser(valueRegistrarUserName)
      , foundationAddress = coreAddresses.getAddressForUser(foundationName)
      , valueOpsAddress = coreAddresses.getAddressForUser(valueOpsName)
      , valueOpsPassphrase = coreAddresses.getPassphraseForUser(valueOpsName)
      , valueDeployerAddress = coreAddresses.getAddressForUser(valueDeployerName)
      , valueRegistrarContractAddress = coreAddresses.getAddressForContract(valueRegistrarContractName)
      , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
      , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
      , valueRegistrar = new ValueRegistrarKlass(valueRegistrarContractAddress)
      , openStUtility = new OpenStUtilityKlass(openSTUtilityContractAddress)
    ;
    
    logger.step('** Deploying valueCore Contract');
    if (showPrompts) {
      // confirming the important addresses
      logger.info("Deployer Address: " + valueDeployerAddress);
      logger.info("Foundation Address: " + foundationAddress);
      logger.info("Value Chain Registrar User Address: " + valueRegistrarUser);
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
    
    const getSimpleTokenPrimeSymbolResponse = await openStUtility.getSimpleTokenPrimeSymbol()
      , stPrimeSymbol = getSimpleTokenPrimeSymbolResponse.data.symbol
      , getSimpleTokenPrimeNameResponse = await openStUtility.getSimpleTokenPrimeName()
      , stPrimeName = getSimpleTokenPrimeNameResponse.data.name
      , getSimpleTokenPrimeConversationRateResponse = await openStUtility.getSimpleTokenPrimeConversationRate()
      , stPrimeConversationRate = getSimpleTokenPrimeConversationRateResponse.data.conversion_rate
      ,
      getSimpleTokenPrimeConversationRateDecimalsResponse = await openStUtility.getSimpleTokenPrimeConversationRateDecimals()
      ,
      stPrimeConversationRateDecimals = getSimpleTokenPrimeConversationRateDecimalsResponse.data.conversion_rate_decimals
    ;
    
    logger.step('** Calling registerUtilityToken of valueRegistrar Contract for ST Prime');
    const registerUtilityTokenResponse = await valueRegistrar.registerUtilityToken(
      valueOpsAddress, valueOpsPassphrase, openSTValueContractAddress, stPrimeSymbol, stPrimeName, stPrimeConversationRate,
      stPrimeConversationRateDecimals, UTILITY_CHAIN_ID, 0, stPrimeUUID, valueDeployerName);
    
    
    if (!registerUtilityTokenResponse.isSuccess()) {
      logger.error('registerUtilityToken of valueRegistrar Contract for ST Prime failed.');
      process.exit(1);
    }
    
    logger.step('** Setting Ops Address of valueRegistrar Contract to valueRegistrar User');
    await valueRegistrar.setOpsAddress(valueDeployerName, valueRegistrarUser);
    
    const opsAddress = await valueRegistrar.getOpsAddress();
    
    if (!valueRegistrarUser.equalsIgnoreCase(opsAddress.data.address)) {
      logger.error('Exiting the deployment as ops address doesn\'t match');
      process.exit(1);
    }
    
    await valueRegistrar.initiateOwnerShipTransfer(valueDeployerName, foundationAddress);
    
    const getOwnerResponse = await valueRegistrar.getOwner();
    
    if (!foundationAddress.equalsIgnoreCase(getOwnerResponse.data.address)) {
      logger.error('Exiting the deployment as owner address doesn\'t match');
      process.exit(1);
    }
    
    return Promise.resolve();
  }
};

InstanceComposer.register(RegisterStPrimeKlass, "getSetupRegisterSTPrime", true);

module.exports = RegisterStPrimeKlass;