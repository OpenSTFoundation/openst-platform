"use strict";

/**
 * Load all the core constants from the environment variables OR define them as literals here and export them.
 *
 * @module config/core_constants
 *
 */

const path = require('path');

const rootPrefix = "..";

function absolutePath(filePath) {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(__dirname, '/' + rootPrefix + '/' + filePath);
  }
  return filePath;
}

/**
 * Constructor for core constants
 *
 * @constructor
 */
const CoreConstants = function () {
};

CoreConstants.prototype = {

  /**
   * Gas price for value chain transactions.<br><br>
   *
   * @constant {number}
   *
   */
  OST_VALUE_GAS_PRICE: process.env.OST_VALUE_GAS_PRICE,

  /**
   * Gas price for utility chain transactions.<br><br>
   *
   * @constant {number}
   *
   */
  OST_UTILITY_GAS_PRICE: process.env.OST_UTILITY_GAS_PRICE,

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
  OST_OPENSTUTILITY_ST_PRIME_UUID: process.env.OST_OPENSTUTILITY_ST_PRIME_UUID,

  /**
   * Value Chain Geth RPC provider
   *
   * @constant {string}
   *
   */
  OST_VALUE_GETH_RPC_PROVIDER: process.env.OST_VALUE_GETH_RPC_PROVIDER,

  /**
   * Value Chain Geth WS provider
   *
   * @constant {string}
   *
   */
  OST_VALUE_GETH_WS_PROVIDER: process.env.OST_VALUE_GETH_WS_PROVIDER,

  /**
   * Value Chain ID
   *
   * @constant {number}
   *
   */
  OST_VALUE_CHAIN_ID: process.env.OST_VALUE_CHAIN_ID,

  /**
   * Utility Chain Geth RPC provider
   *
   * @constant {string}
   *
   */
  OST_UTILITY_GETH_RPC_PROVIDER: process.env.OST_UTILITY_GETH_RPC_PROVIDER,

  /**
   * Utility Chain Geth WS provider
   *
   * @constant {string}
   *
   */
  OST_UTILITY_GETH_WS_PROVIDER: process.env.OST_UTILITY_GETH_WS_PROVIDER,

  /**
   * Utility Chain ID
   *
   * @constant {number}
   *
   */
  OST_UTILITY_CHAIN_ID: process.env.OST_UTILITY_CHAIN_ID,

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
  CACHING_ENGINE: process.env.OST_CACHING_ENGINE,

  /**
   * debug log level.
   *
   * @constant {string}
   *
   */
  DEBUG_ENABLED: process.env.OST_DEBUG_ENABLED,

  /**
   * stand alone mode on?
   *
   * @constant {number}
   *
   */
  STANDALONE_MODE: process.env.OST_STANDALONE_MODE || 0
};

module.exports = new CoreConstants();