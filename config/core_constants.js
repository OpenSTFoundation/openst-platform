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

const are_we_ready_to_use_env_var = false; //@Abhay: Change this when we are :).

const oneGW = '0x3B9ACA00' // taken from http://ethgasstation.info/ ---- 1 gwei
  , fiveGW = '0x12A05F200'; // 5 GWei

define("OST_DEFAULT_GAS_PRICE", fiveGW);


if ( are_we_ready_to_use_env_var ) {
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
}
else {
  
  //GETH
  define("OST_GETH_VALUE_CHAIN_RPC_PROVIDER", "http://localhost:8545");
  define("OST_GETH_VALUE_CHAIN_WS_PROVIDER", "ws://localhost:18545");

  define("OST_GETH_UTILITY_CHAIN_RPC_PROVIDER","http://localhost:9546");
  define("OST_GETH_UTILITY_CHAIN_WS_PROVIDER","ws://localhost:19546");

  const Config = require("../Config");
  //ACTORS
  define("OST_FOUNDATION_ADDRESS",  Config.SimpleTokenFoundation);

  const ValueChain = Config.ValueChain;
  define("OST_REGISTRAR_ADDRESS", ValueChain.Admin );
  define("OST_REGISTRAR_SECRET_KEY", "");


  //CONTRACTS
  define("OST_SIMPLETOKEN_CONTRACT_ADDRESS", ValueChain.SimpleToken || "");
  define("OST_STAKE_CONTRACT_ADDRESS", ValueChain.Stake || "");

}

define('OST_GETH_UTILITY_RPC_PROVIDER', process.env.OST_GETH_UTILITY_RPC_PROVIDER)
define('OST_GETH_UTILITY_WS_PROVIDER', process.env.OST_GETH_UTILITY_WS_PROVIDER)
define('OST_GETH_VALUE_RPC_PROVIDER', process.env.OST_GETH_VALUE_RPC_PROVIDER)
define('OST_GETH_VALUE_WS_PROVIDER', process.env.OST_GETH_VALUE_WS_PROVIDER)

// contract addresses
define('OST_SIMPLE_TOKEN_CONTRACT_ADDR', process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR)
define('OST_STAKING_CONTRACT_ADDR', process.env.OST_STAKING_CONTRACT_ADDR)
define('OST_UTILITY_TOKEN_CONTRACT_ADDR', process.env.OST_UTILITY_TOKEN_CONTRACT_ADDR)
