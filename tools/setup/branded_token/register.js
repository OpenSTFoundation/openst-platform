'use strict';
/**
 * Register Branded Token
 *
 * @module tools/setup/branded_token/register
 */

const Path = require('path'),
  os = require('os');

const rootPrefix = '../../..',
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  tokenHelper = require(rootPrefix + '/tools/setup/branded_token/helper'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/services/utils/generate_address');
require(rootPrefix + '/services/on_boarding/propose_branded_token');
require(rootPrefix + '/services/on_boarding/get_registration_status');
require(rootPrefix + '/lib/web3/providers/storage');

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
 * Constructor for proposing branded token
 *
 * @param {object} params - this is params
 * @param {object} params.bt_symbol - branded token symbol
 * @param {object} params.bt_name - branded token name
 * @param {object} params.bt_conversion_factor - branded token conversion factor
 * @param {string} params.config_strategy_file_path - path to file containing config strategy
 
 *
 * @constructor
 */
const RegisterBTKlass = function(params) {
  const oThis = this;

  oThis.btName = params.bt_name; // branded token name
  oThis.btSymbol = params.bt_symbol; // branded token symbol
  oThis.btConversionFactor = params.bt_conversion_factor; // branded token to OST conversion factor, 1 OST = 10 ACME
  oThis.config_strategy_file_path = params.config_strategy_file_path;

  oThis.reserveAddress = ''; // Member company address (will be generated and populated)
  oThis.reservePassphrase = 'acmeOnopenST'; // Member company address passphrase

  oThis.uuid = ''; // Member company uuid (will be generated and populated)
  oThis.erc20 = ''; // Member company ERC20 contract address (will be generated and populated)

  let configStrategy = oThis.config_strategy_file_path
    ? require(oThis.config_strategy_file_path)
    : require(setupHelper.configStrategyFilePath());
  oThis.ic = new InstanceComposer(configStrategy);
};

RegisterBTKlass.prototype = {
  /**
   * Start BT proposal
   */
  perform: async function() {
    const oThis = this;

    // Validate new branded token
    logger.step('** Validating branded token');
    await oThis._validateBrandedTokenDetails();

    // Generate reserve address
    logger.step('** Generating reserve address');
    let addressRes = await oThis._generateAddress();
    oThis.reserveAddress = addressRes.data.address;
    logger.info('* address:', oThis.reserveAddress);

    // Start the BT proposal
    let proposeRes = await oThis._propose();

    // Monitor the BT proposal response
    let statusRes = await oThis._checkProposeStatus(proposeRes.data.transaction_hash);
    let registrationStatus = statusRes.data.registration_status;
    oThis.uuid = registrationStatus['uuid'];
    oThis.erc20 = registrationStatus['erc20_address'];

    // Add branded token to config file
    logger.step('** Updating branded token config file');
    await oThis._updateBrandedTokenConfig();

    // Allocating shard for storage of token balances
    logger.step('** Allocating shard for storage of token balances');
    await oThis._allocateShard();

    process.exit(0);
  },

  /**
   * Generate reserve address
   *
   * @return {promise<result>}
   * @private
   */
  _generateAddress: async function() {
    const oThis = this,
      generateAddress = oThis.ic.getGenerateAddressService();

    const addressObj = new generateAddress({ chain: 'utility', passphrase: oThis.reservePassphrase }),
      addressResponse = await addressObj.perform();
    if (addressResponse.isFailure()) {
      logger.error('* Reserve address generation failed with error:', addressResponse);
      process.exit(1);
    }
    return Promise.resolve(addressResponse);
  },

  /**
   * Start the proposal of branded token
   *
   * @return {promise<result>}
   * @private
   */
  _propose: async function() {
    const oThis = this,
      proposeBrandedToken = oThis.ic.getProposeBrandedTokenKlassClass();

    logger.step('** Starting BT proposal');
    logger.info('* Name:', oThis.btName, 'Symbol:', oThis.btSymbol, 'Conversion Factor:', oThis.btConversionFactor);
    const proposeBTObj = new proposeBrandedToken({
      name: oThis.btName,
      symbol: oThis.btSymbol,
      conversion_factor: oThis.btConversionFactor
    });
    const proposeBTResponse = await proposeBTObj.perform();
    if (proposeBTResponse.isFailure()) {
      logger.error('* Proposal failed with error:', proposeBTResponse.getDebugData());
      process.exit(1);
    }
    return Promise.resolve(proposeBTResponse);
  },

  /**
   * Check propose status
   *
   * @param {string} transaction_hash - BT proposal transaction hash
   * @return {promise<result>}
   * @private
   *
   */
  _checkProposeStatus: function(transaction_hash) {
    const oThis = this,
      getRegistrationStatus = oThis.ic.getRegistrationStatusService(),
      timeInterval = 5000,
      proposeSteps = { is_proposal_done: 0, is_registered_on_uc: 0, is_registered_on_vc: 0 };

    return new Promise(function(onResolve, onReject) {
      logger.step('** Monitoring BT proposal status');
      const statusObj = new getRegistrationStatus({ transaction_hash: transaction_hash });
      let statusTimer = setInterval(async function() {
        let statusResponse = await statusObj.perform();
        if (statusResponse.isFailure()) {
          logger.error(statusResponse);
          clearInterval(statusTimer);
          process.exit(1);
        } else {
          let registrationStatus = statusResponse.data.registration_status;
          if (proposeSteps['is_proposal_done'] != registrationStatus['is_proposal_done']) {
            logger.info('* BT proposal done on utility chain. Waiting for registration utility and value chain.');
            proposeSteps['is_proposal_done'] = registrationStatus['is_proposal_done'];
          }
          if (proposeSteps['is_registered_on_uc'] != registrationStatus['is_registered_on_uc']) {
            logger.info('* BT registration done on utility chain. Waiting for registration on value chain.');
            proposeSteps['is_registered_on_uc'] = registrationStatus['is_registered_on_uc'];
          }
          if (proposeSteps['is_registered_on_vc'] != registrationStatus['is_registered_on_vc']) {
            logger.info('* BT registration done on value chain.');
            proposeSteps['is_registered_on_vc'] = registrationStatus['is_registered_on_vc'];

            clearInterval(statusTimer);
            return onResolve(statusResponse);
          }
        }
      }, timeInterval);
    });
  },

  /**
   * Check for duplicate branded token
   *
   * @return {boolean}
   * @private
   */
  _validateBrandedTokenDetails: async function() {
    const oThis = this,
      existingBrandedTokens = await oThis._loadBrandedTokenConfig();
    for (let uuid in existingBrandedTokens) {
      let brandedToken = existingBrandedTokens[uuid];
      if (oThis.btName.equalsIgnoreCase(brandedToken.Name)) {
        logger.error('* Branded token name already registered and present in BT config file');
        process.exit(1);
      }
      if (oThis.btSymbol.equalsIgnoreCase(brandedToken.Symbol)) {
        logger.error('* Branded token symbol already registered and present in BT config file');
        process.exit(1);
      }
    }
    return true;
  },

  /**
   * Update branded token details
   *
   * @return {promise<object>} - branded tokens list
   * @private
   */
  _updateBrandedTokenConfig: async function() {
    const oThis = this,
      existingBrandedTokens = await oThis._loadBrandedTokenConfig();

    if (existingBrandedTokens[oThis.uuid]) {
      logger.error('* Branded token uuid already registered and present in BT config file');
      process.exit(1);
    }

    existingBrandedTokens[oThis.uuid] = {
      Name: oThis.btName,
      Symbol: oThis.btSymbol,
      ConversionFactor: oThis.btConversionFactor,
      Reserve: oThis.reserveAddress,
      ReservePassphrase: oThis.reservePassphrase,
      UUID: oThis.uuid,
      ERC20: oThis.erc20
    };

    logger.info('* Branded token config:', existingBrandedTokens[oThis.uuid]);

    return tokenHelper.addBrandedToken(existingBrandedTokens);
  },

  /**
   * Allocate shard to branded token
   *
   * @return {promise<object>} -
   * @private
   */
  _allocateShard: async function() {
    const oThis = this,
      openSTStorageProvider = oThis.ic.getStorageProvider(),
      openSTStorage = openSTStorageProvider.getInstance();

    await new openSTStorage.model.TokenBalance({
      erc20_contract_address: oThis.erc20
    }).allocate();
  },

  /**
   * Load branded token details
   *
   * @return {promise<object>} - branded tokens list
   * @private
   */
  _loadBrandedTokenConfig: async function() {
    return await tokenHelper.getBrandedToken();
  }
};

const args = process.argv,
  btName = args[2],
  btSymbol = args[3],
  btConversionFactor = args[4],
  configStrategyFilePath = args[5];

// Start Registration
const services = new RegisterBTKlass({
  bt_name: btName,
  bt_symbol: btSymbol,
  bt_conversion_factor: btConversionFactor,
  config_strategy_file_path: configStrategyFilePath
});
services.perform();
