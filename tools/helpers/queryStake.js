"use strict";
/*
 * transfer event from BrandedTokenContract
 *
 * * Author: Rachin Kapoor
 * * Date: 26/10/2017
 * * Reviewed by: Sunil
 */

const reqPrefix = "../.."
      ,coreConstants = require(reqPrefix + '/config/core_constants')
      ,Geth = require(reqPrefix + "/lib/geth")
      ,FOUNDATION = coreConstants.OST_FOUNDATION_ADDRESS
      ,REGISTRAR = coreConstants.OST_REGISTRAR_ADDRESS
      ,SIMPLETOKEN_CONTRACT = coreConstants.OST_SIMPLETOKEN_CONTRACT_ADDRESS
      ,STAKE_CONTRACT = coreConstants.OST_STAKE_CONTRACT_ADDRESS
;



const queryStaking = function () {
  const ContractJson = require( reqPrefix +  "/contracts/Staking.json")
        ,contractAddress = STAKE_CONTRACT
        ,displayName = "Stake"
        ,colorCode = "\x1b[35m"
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,contract = new Geth.ValueChain.eth.Contract(contractAbi, contractAddress)
        ,_uuid = "0xc015ad07a0ce24998b478572227111e0fb0d8f26fbcb0e6422e7fc15639eb7ac"
        ,_mintingIntentHash = "0x702eabb3dba5b1a3cef0f60f359281d362653a00deb8177763b420052675c222"
  ;

  contract.setProvider(Geth.ValueChain.currentProvider);
  contract.methods.getStake(_uuid, _mintingIntentHash).call().then(function () {
    console.log( arguments );
  });
};

queryStaking();


