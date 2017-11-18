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

//GETH
define("OST_GETH_VALUE_CHAIN_RPC_PROVIDER", process.env.OST_GETH_VALUE_CHAIN_RPC_PROVIDER);
define("OST_GETH_VALUE_CHAIN_WS_PROVIDER", process.env.OST_GETH_VALUE_CHAIN_WS_PROVIDER);

define("OST_GETH_UTILITY_CHAIN_RPC_PROVIDER", process.env.OST_GETH_UTILITY_CHAIN_RPC_PROVIDER);
define("OST_GETH_UTILITY_CHAIN_WS_PROVIDER", process.env.OST_GETH_UTILITY_CHAIN_WS_PROVIDER);

//ACTORS
define("OST_FOUNDATION_ADDRESS", process.env.OST_FOUNDATION_ADDRESS);

define("OST_REGISTRAR_ADDRESS", process.env.OST_REGISTRAR_ADDRESS);
define("OST_REGISTRAR_SECRET_KEY", process.env.OST_REGISTRAR_SECRET_KEY || "");


//CONTRACTS
define("OST_SIMPLETOKEN_CONTRACT_ADDRESS", process.env.OST_SIMPLETOKEN_CONTRACT_ADDRESS || "");
define("OST_STAKE_CONTRACT_ADDRESS", process.env.OST_STAKE_CONTRACT_ADDRESS || "");

