"use strict";

const readline = require('readline')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , deployHelper = require(rootPrefix + '/tools/deploy/helper')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , ValueRegistrarKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
;

const valueDeployerName = 'valueDeployer'
  , valueOpsName = 'valueOps'
  , valueRegistrarUserName = 'valueRegistrar'
  , foundationName = 'foundation'
  , openSTValueContractName = 'openSTValue'
  , openSTUtilityContractName = 'openSTUtility'
  , valueRegistrarContractName = 'valueRegistrar'
  , valueCoreContractName = 'valueCore'
  , UTILITY_CHAIN_ID = coreConstants.OST_UTILITY_CHAIN_ID
  , stPrimeUUID = coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID
  , valueRegistrarUser = coreAddresses.getAddressForUser(valueRegistrarUserName)
  , foundationAddress = coreAddresses.getAddressForUser(foundationName)
  , valueOpsAddress = coreAddresses.getAddressForUser(valueOpsName)
  , valueOpsPassphrase = coreAddresses.getPassphraseForUser(valueOpsName)
  , valueDeployerAddress = coreAddresses.getAddressForUser(valueDeployerName)
  , valueRegistrarContractAddress = coreAddresses.getAddressForContract(valueRegistrarContractName)
  , valueCoreContractAddress = coreAddresses.getAddressForContract(valueCoreContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , valueRegistrar = new ValueRegistrarKlass(valueRegistrarContractAddress)
  , openStUtility = new OpenStUtilityKlass(openSTUtilityContractAddress)
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
const RegisterStPrimeKlass = function () {};

RegisterStPrimeKlass.prototype = {
  /**
   * Perform
   *
   * @param {boolean} showPrompts - Show prompts
   *
   * @return {promise<result>}
   */
  perform: async function (showPrompts) {
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

    logger.step('** Calling addCore of Value Registrar Contract');
    await valueRegistrar.addCore(valueOpsName, openSTValueContractAddress, valueCoreContractAddress);

    const getSimpleTokenPrimeSymbolResponse = await openStUtility.getSimpleTokenPrimeSymbol()
      , stPrimeSymbol = getSimpleTokenPrimeSymbolResponse.data.symbol
      , getSimpleTokenPrimeNameResponse = await openStUtility.getSimpleTokenPrimeName()
      , stPrimeName = getSimpleTokenPrimeNameResponse.data.name
      , getSimpleTokenPrimeConversationRateResponse = await openStUtility.getSimpleTokenPrimeConversationRate()
      , stPrimeConversationRate = getSimpleTokenPrimeConversationRateResponse.data.conversion_rate
    ;

    logger.step('** Calling registerUtilityToken of valueRegistrar Contract for ST Prime');
    const registerUtilityTokenResponse = await valueRegistrar.registerUtilityToken(
      valueOpsAddress, valueOpsPassphrase, openSTValueContractAddress, stPrimeSymbol, stPrimeName, stPrimeConversationRate,
      UTILITY_CHAIN_ID, 0, stPrimeUUID, valueDeployerName);


    if (registerUtilityTokenResponse.data.rawTransactionReceipt.logs.length == 0) {
      logger.error('UtilityTokenRegistered event not found in receipt.');
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

module.exports = new RegisterStPrimeKlass();