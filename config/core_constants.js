"use strict";

/*
 * Constants file
 *
 * * Author: Rachin
 * * Date: 16/10/2017
 * * Reviewed by: 
 *
 */
function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

const oneGW = '0x3B9ACA00' // taken from http://ethgasstation.info/ ---- 1 gwei
  , fiveGW = '0x12A05F200'; // 5 GWei

define("OST_DEFAULT_GAS_PRICE", fiveGW);
define('OST_TOTAL_SIMPLETOKENS', process.env.OST_TOTAL_SIMPLETOKENS);

//GETH
define('OST_GETH_VALUE_RPC_PROVIDER', process.env.OST_GETH_VALUE_RPC_PROVIDER);
define('OST_GETH_VALUE_WS_PROVIDER', process.env.OST_GETH_VALUE_WS_PROVIDER);

define('OST_GETH_UTILITY_RPC_PROVIDER', process.env.OST_GETH_UTILITY_RPC_PROVIDER);
define('OST_GETH_UTILITY_WS_PROVIDER', process.env.OST_GETH_UTILITY_WS_PROVIDER);

define('OST_VALUE_CHAIN_ID', process.env.OST_VALUE_CHAIN_ID);

define('OST_UTILITY_CHAIN_ID', process.env.OST_UTILITY_CHAIN_ID);

