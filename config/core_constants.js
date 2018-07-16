"use strict";

/**
 * Load all the core constants from the environment variables OR define them as literals here and export them.
 *
 * @module config/core_constants
 *
 */

const path = require('path');

const rootPrefix = ".."
    , InstanceComposer = require( rootPrefix + "/instance_composer")
;

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
const CoreConstants = function ( configStrategy, instanceComposer) {
  const oThis = this;
  if ( configStrategy && instanceComposer ) {
    //TBD-CS: Remove this condition.
    oThis.OST_VALUE_GAS_PRICE               = configStrategy.OST_VALUE_GAS_PRICE;
    oThis.OST_UTILITY_GAS_PRICE             = configStrategy.OST_UTILITY_GAS_PRICE;
    oThis.OST_OPENSTUTILITY_ST_PRIME_UUID   = configStrategy.OST_OPENSTUTILITY_ST_PRIME_UUID;
    oThis.OST_VALUE_GETH_RPC_PROVIDER       = configStrategy.OST_VALUE_GETH_RPC_PROVIDER;
    oThis.OST_VALUE_GETH_WS_PROVIDER        = configStrategy.OST_VALUE_GETH_WS_PROVIDER;
    oThis.OST_VALUE_CHAIN_ID                = configStrategy.OST_VALUE_CHAIN_ID;
    oThis.OST_UTILITY_GETH_RPC_PROVIDER     = configStrategy.OST_UTILITY_GETH_RPC_PROVIDER;
    oThis.OST_UTILITY_GETH_WS_PROVIDER      = configStrategy.OST_UTILITY_GETH_WS_PROVIDER;
    oThis.OST_UTILITY_CHAIN_ID              = configStrategy.OST_UTILITY_CHAIN_ID;
    oThis.OST_CACHING_ENGINE                = configStrategy.OST_CACHING_ENGINE;
    oThis.OST_DEBUG_ENABLED                 = configStrategy.OST_DEBUG_ENABLED || 0;
    oThis.OST_STANDALONE_MODE               = configStrategy.OST_STANDALONE_MODE || 0;
    oThis.AUTO_SCALE_DYNAMO                 = configStrategy.AUTO_SCALE_DYNAMO || 0;
  }
};


//TBD-CS: assign all properties to default values or null.
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
  STANDALONE_MODE: process.env.OST_STANDALONE_MODE || 0,

  AUTO_SCALE_DYNAMO: process.env.AUTO_SCALE_DYNAMO
};

InstanceComposer.register(CoreConstants, "getCoreConstants", true);

module.exports = new CoreConstants(); //TBD-CS: Expose the class only.