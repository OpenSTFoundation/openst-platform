"use strict";
/*
 * transfer event from BrandedTokenContract
 *
 * * Author: Rachin Kapoor
 * * Date: 26/10/2017
 * * Reviewed by: Sunil
 */

const Web3 = require("web3")
      ,reqPrefix = "../.."
      ,Config = require(reqPrefix + "/config.json")
;



const queryStaking = function () {
  const ContractJson = require( reqPrefix +  "/contracts/Staking.json")
        ,contractAddress = Config.ValueChain.Stake
        ,displayName = "Stake"
        ,colorCode = "\x1b[35m"
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,Geth = require(reqPrefix + "/lib/geth")
        ,contract = new Geth.ValueChain.eth.Contract(contractAbi, contractAddress)
        ,_uuid = "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3"
        ,_mintingIntentHash = "0x1a4840e3d4b19e248883b3003390224d6f27ecce9e180d33353a02245da246eb"
  ;

  contract.setProvider(Geth.ValueChain.currentProvider);
  contract.methods.getStake(_uuid, _mintingIntentHash).call().then(function () {
    console.log( arguments );
  });
};

queryStaking();


