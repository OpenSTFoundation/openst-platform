"use strict";
/**
 * Register Branded Token
 *
 * @module tools/setup/branded_token/register
 */

const Path = require('path')
  , os = require('os')
;

const rootPrefix = '../../..'
  , generateAddress = require(rootPrefix + '/services/utils/generate_address')
  , proposeBrandedToken = require(rootPrefix + '/services/on_boarding/propose_branded_token')
  , getRegistrationStatus = require(rootPrefix + '/services/on_boarding/get_registration_status')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , tokenHelper = require(rootPrefix + '/tools/setup/branded_token/helper')
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
 * Constructor for proposing branded token
 *
 * @param {object} params - this is params 
 * @param {object} params.bt_symbol - branded token symbol
 * @param {object} params.bt_name - branded token name
 * @param {object} params.bt_conversion_rate - branded token conversion rate
 * @param {object} params.bt_conversion_rate_decimals - branded token conversion rate decimal
 
 *
 * @constructor
 */
const RegisterBTKlass = function (params) {
  const oThis = this;

  oThis.btName = params.bt_name; // branded token name
  oThis.btSymbol = params.bt_symbol; // branded token symbol
  oThis.btConversionRate = params.bt_conversion_rate; // branded token to OST conversion rate, 1 OST = 10 ACME
  oThis.btConversionRateDecimals = params.bt_conversion_rate_decimals; // conversion rate decimals 

  oThis.reserveAddress = ''; // Member company address (will be generated and populated)
  oThis.reservePassphrase = 'acmeOnopenST'; // Member company address passphrase

  oThis.uuid = ''; // Member company uuid (will be generated and populated)
  oThis.erc20 = ''; // Member company ERC20 contract address (will be generated and populated)
};

RegisterBTKlass.prototype = {
  /**
   * Start BT proposal
   */
  perform: async function () {
    const oThis = this;

    // Validate new branded token
    logger.step("** Validating branded token");
    await oThis._validateBrandedTokenDetails();

    // Generate reserve address
    logger.step("** Generating reserve address");
    var addressRes = await oThis._generateAddress();
    oThis.reserveAddress = addressRes.data.address;
    logger.info("* address:", oThis.reserveAddress);

    // Start the BT proposal
    var proposeRes = await oThis._propose();

    // Monitor the BT proposal response
    var statusRes = await oThis._checkProposeStatus(proposeRes.data.transaction_hash);
    var registrationStatus = statusRes.data.registration_status;
    oThis.uuid = registrationStatus['uuid'];
    oThis.erc20 = registrationStatus['erc20_address'];

    // Add branded token to config file
    logger.step("** Updating branded token config file");
    await oThis._updateBrandedTokenConfig();

    process.exit(0);

  },

  /**
   * Generate reserve address
   *
   * @return {promise<result>}
   * @private
   */
  _generateAddress: async function() {
    const oThis = this
    ;
    const addressObj = new generateAddress({chain: 'utility', passphrase: oThis.reservePassphrase})
      , addressResponse = await addressObj.perform();
    if (addressResponse.isFailure()) {
      logger.error("* Reserve address generation failed with error:", addressResponse);
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
    const oThis = this
    ;
    logger.step("** Starting BT proposal");
    logger.info("* Name:", oThis.btName, "Symbol:", oThis.btSymbol, "Conversion Rate:", oThis.btConversionRate, "Conversion Rate Decimals: ", oThis.btConversionRateDecimals);
    const proposeBTObj = new proposeBrandedToken(
      {name: oThis.btName, symbol: oThis.btSymbol, conversion_rate: oThis.btConversionRate, conversion_rate_decimals: oThis.btConversionRateDecimals}
    );
    const proposeBTResponse = await proposeBTObj.perform();
    if (proposeBTResponse.isFailure()) {
      logger.error("* Proposal failed with error:", proposeBTResponse);
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
    const oThis = this
      , timeInterval = 5000
      , proposeSteps = {is_proposal_done: 0, is_registered_on_uc: 0, is_registered_on_vc: 0}
    ;

    return new Promise(function(onResolve, onReject){

      logger.step("** Monitoring BT proposal status");
      const statusObj = new getRegistrationStatus({transaction_hash: transaction_hash});
      var statusTimer = setInterval(async function () {
        var statusResponse = await statusObj.perform();
        if (statusResponse.isFailure()) {
          logger.error(statusResponse);
          clearInterval(statusTimer);
          process.exit(1);
        } else {
          var registrationStatus = statusResponse.data.registration_status;
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
    const oThis = this
      , existingBrandedTokens = await oThis._loadBrandedTokenConfig()
    ;
    for (var uuid in existingBrandedTokens) {
      var brandedToken = existingBrandedTokens[uuid];
      if (oThis.btName.equalsIgnoreCase(brandedToken.Name)) {
        logger.error("* Branded token name already registered and present in BT config file");
        process.exit(1);
      }
      if (oThis.btSymbol.equalsIgnoreCase(brandedToken.Symbol)) {
        logger.error("* Branded token symbol already registered and present in BT config file");
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
    const oThis = this
      , existingBrandedTokens = await oThis._loadBrandedTokenConfig()
    ;

    if (existingBrandedTokens[oThis.uuid]) {
      logger.error("* Branded token uuid already registered and present in BT config file");
      process.exit(1);
    }

    existingBrandedTokens[oThis.uuid] = {
      Name: oThis.btName,
      Symbol: oThis.btSymbol,
      ConversionRate: oThis.btConversionRate,
      ConversionRateDecimals: oThis.btConversionRateDecimals,
      Reserve: oThis.reserveAddress,
      ReservePassphrase: oThis.reservePassphrase,
      UUID: oThis.uuid,
      ERC20: oThis.erc20
    };

    logger.info("* Branded token config:", existingBrandedTokens[oThis.uuid]);

    return tokenHelper.addBrandedToken(existingBrandedTokens);
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

const args = process.argv
  , btName = args[2]
  , btSymbol = args[3]
  , btConversionRate = args[4]
  , btConversionRateDecimals = args[5] 
;

// Start Registration
const services = new RegisterBTKlass({bt_name: btName, bt_symbol: btSymbol, bt_conversion_rate: btConversionRate, bt_conversion_rate_decimals: btConversionRateDecimals});
services.perform();
