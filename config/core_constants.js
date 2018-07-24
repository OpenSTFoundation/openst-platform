'use strict';

/**
 * Load all the core constants from config strategy OR define them as literals here and export them.
 *
 * @module config/core_constants
 *
 */

const path = require('path');

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

/**
 * Constructor for core constants
 *
 * @constructor
 */
const CoreConstants = function(configStrategy, instanceComposer) {
  const oThis = this;
  oThis.OST_VALUE_GAS_PRICE = configStrategy.OST_VALUE_GAS_PRICE;
  oThis.OST_UTILITY_GAS_PRICE = configStrategy.OST_UTILITY_GAS_PRICE;
  oThis.OST_OPENSTUTILITY_ST_PRIME_UUID = configStrategy.OST_OPENSTUTILITY_ST_PRIME_UUID;
  oThis.OST_VALUE_GETH_RPC_PROVIDER = configStrategy.OST_VALUE_GETH_RPC_PROVIDER;
  oThis.OST_VALUE_GETH_WS_PROVIDER = configStrategy.OST_VALUE_GETH_WS_PROVIDER;
  oThis.OST_VALUE_CHAIN_ID = configStrategy.OST_VALUE_CHAIN_ID;
  oThis.OST_UTILITY_GETH_RPC_PROVIDER = configStrategy.OST_UTILITY_GETH_RPC_PROVIDER;
  oThis.OST_UTILITY_GETH_WS_PROVIDER = configStrategy.OST_UTILITY_GETH_WS_PROVIDER;
  oThis.OST_UTILITY_CHAIN_ID = configStrategy.OST_UTILITY_CHAIN_ID;
  oThis.OST_CACHING_ENGINE = configStrategy.OST_CACHING_ENGINE;
  oThis.OST_DEBUG_ENABLED = configStrategy.OST_DEBUG_ENABLED || 0;
  oThis.OST_STANDALONE_MODE = configStrategy.OST_STANDALONE_MODE || 0;
  oThis.AUTO_SCALE_DYNAMO = configStrategy.AUTO_SCALE_DYNAMO || 0;
};

CoreConstants.prototype = {
  /**
   * Gas price for value chain transactions.<br><br>
   *
   * @constant {number}
   *
   */
  OST_VALUE_GAS_PRICE: null,

  /**
   * Gas price for utility chain transactions.<br><br>
   *
   * @constant {number}
   *
   */
  OST_UTILITY_GAS_PRICE: null,

  /**
   * Zero gas constant to deploy on Utility Chain.<br><br>
   *
   * @constant {number}
   *
   */
  OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT: '0x0',

  /**
   * Total ST' Supply on utility chain.<br><br>
   *
   * @constant {number}
   *
   */
  OST_UTILITY_STPRIME_TOTAL_SUPPLY: '800000000',

  /**
   * ST' UUID on utility chain.<br><br>
   *
   * @constant {string}
   *
   */
  OST_OPENSTUTILITY_ST_PRIME_UUID: null,

  /**
   * Value Chain Geth RPC provider
   *
   * @constant {string}
   *
   */
  OST_VALUE_GETH_RPC_PROVIDER: null,

  /**
   * Value Chain Geth WS provider
   *
   * @constant {string}
   *
   */
  OST_VALUE_GETH_WS_PROVIDER: null,

  /**
   * Value Chain ID
   *
   * @constant {number}
   *
   */
  OST_VALUE_CHAIN_ID: null,

  /**
   * Utility Chain Geth RPC provider
   *
   * @constant {string}
   *
   */
  OST_UTILITY_GETH_RPC_PROVIDER: null,

  /**
   * Utility Chain Geth WS provider
   *
   * @constant {string}
   *
   */
  OST_UTILITY_GETH_WS_PROVIDER: null,

  /**
   * Utility Chain ID
   *
   * @constant {number}
   *
   */
  OST_UTILITY_CHAIN_ID: null,

  /**
   * Gas limit on value chain
   *
   * @constant {number}
   *
   */
  OST_VALUE_GAS_LIMIT: 4700000,

  /**
   * Gas limit on utility chain
   *
   * @constant {number}
   *
   */
  OST_UTILITY_GAS_LIMIT: 9000000,

  /**
   * ALLOWED VALUES => NONE/REDIS/MEMCACHED
   *
   * @constant {string}
   *
   */
  CACHING_ENGINE: null,

  /**
   * debug log level.
   *
   * @constant {string}
   *
   */
  DEBUG_ENABLED: null,

  /**
   * stand alone mode on?
   *
   * @constant {number}
   *
   */
  OST_STANDALONE_MODE: 0,

  AUTO_SCALE_DYNAMO: null
};

InstanceComposer.register(CoreConstants, 'getCoreConstants', true);

module.exports = CoreConstants;
