"use strict";

/*
 * Constants file: Load constants from evvironment variables
 *
 */

function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

// different gas values in hex code. taken from http://ethgasstation.info/
const oneGW = '0x3B9ACA00' // 1 Gwei
  , fiveGW = '0x12A05F200'; // 5 GWei

// Default Gas
define("OST_DEFAULT_GAS_PRICE", fiveGW);

// Total ST' Supply on utility chain
define('OST_UTILITY_STPRIME_TOTAL_SUPPLY', process.env.OST_UTILITY_STPRIME_TOTAL_SUPPLY);

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
define('OST_OPENSTUTILITY_ST_PRIME_UUID', process.env.OST_OPENSTUTILITY_ST_PRIME_UUID);

