"use strict";

/*
 * Constants file: Load constants from environment variables
 *
 */

const path = require('path');

const rootPrefix = "..";

// Define
function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

function absolutePath(filePath) {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(__dirname, '/' + rootPrefix + '/' + filePath);
  }
  return filePath;
}

// Gas price for value chain
define("OST_VALUE_GAS_PRICE", process.env.OST_VALUE_GAS_PRICE);

// Gas price for utility chain
define("OST_UTILITY_GAS_PRICE", process.env.OST_UTILITY_GAS_PRICE);

// Zero gas constant to deploy on Utility Chain
define("OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT", '0x0');

// Total ST' Supply on utility chain
define('OST_UTILITY_STPRIME_TOTAL_SUPPLY', process.env.OST_UTILITY_STPRIME_TOTAL_SUPPLY);

// ST' UUID on utility chain
define('OST_OPENSTUTILITY_ST_PRIME_UUID', process.env.OST_OPENSTUTILITY_ST_PRIME_UUID);

// Value Chain Geth
define('OST_GETH_VALUE_RPC_PROVIDER', process.env.OST_GETH_VALUE_RPC_PROVIDER);
define('OST_GETH_VALUE_WS_PROVIDER', process.env.OST_GETH_VALUE_WS_PROVIDER);

// Value Chain ID
define('OST_VALUE_CHAIN_ID', process.env.OST_VALUE_CHAIN_ID);

// Utility Chain Geth
define('OST_GETH_UTILITY_RPC_PROVIDER', process.env.OST_GETH_UTILITY_RPC_PROVIDER);
define('OST_GETH_UTILITY_WS_PROVIDER', process.env.OST_GETH_UTILITY_WS_PROVIDER);

// Utility Chain ID
define('OST_UTILITY_CHAIN_ID', process.env.OST_UTILITY_CHAIN_ID);

// Gas limit on value and utility chains
define('OST_VALUE_GAS_LIMIT', 4700000);
define('OST_UTILITY_GAS_LIMIT', 9000000);

// file path of the member config file.
define('OST_MEMBER_CONFIG_FILE_PATH', absolutePath(process.env.OST_MEMBER_CONFIG_FILE_PATH));

// Folder path of the transfer logs
define('OST_TRANSACTION_LOGS_FOLDER', absolutePath(process.env.OST_TRANSACTION_LOGS_FOLDER));

// ALLOWED VALUES => NONE/REDIS/MEMCACHED
define('CACHING_ENGINE', process.env.CACHING_ENGINE);
