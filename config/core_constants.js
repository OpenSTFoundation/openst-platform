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

//GETH
define('OST_GETH_VALUE_RPC_PROVIDER', process.env.OST_GETH_VALUE_RPC_PROVIDER);
define('OST_GETH_VALUE_WS_PROVIDER', process.env.OST_GETH_VALUE_WS_PROVIDER);

define('OST_GETH_UTILITY_RPC_PROVIDER', process.env.OST_GETH_UTILITY_RPC_PROVIDER);
define('OST_GETH_UTILITY_WS_PROVIDER', process.env.OST_GETH_UTILITY_WS_PROVIDER);

// Contract Addresses
define('OST_SIMPLE_TOKEN_CONTRACT_ADDR', process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR);
define('OST_STAKING_CONTRACT_ADDR', process.env.OST_STAKING_CONTRACT_ADDR);
define('OST_UTILITY_TOKEN_CONTRACT_ADDR', process.env.OST_UTILITY_TOKEN_CONTRACT_ADDR);

//ACTORS
define("OST_FOUNDATION_ADDR", process.env.OST_FOUNDATION_ADDR);
define('OST_FOUNDATION_PASSPHRASE', process.env.OST_FOUNDATION_PASSPHRASE);

define("OST_REGISTRAR_ADDR", process.env.OST_REGISTRAR_ADDR);
define("OST_REGISTRAR_PASSPHRASE", process.env.OST_REGISTRAR_PASSPHRASE || "");

