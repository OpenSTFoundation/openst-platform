"use strict";

const rootPrefix = "../.."
  , web3 = require(rootPrefix+"/lib/web3/providers/value_rpc")
  , helper = require(rootPrefix + "/lib/contract_interact/helper")
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , coreAddresses = require(rootPrefix+"/config/core_addresses")
  , responseHelper = require(rootPrefix+"/lib/formatter/response")
  , contractName = "simpleStake"
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
;

const SimpleStake = module.exports = function (contractAddress) { 
  this.contractAddress = contractAddress;
  const contract = this.contract = new web3.eth.Contract( contractAbi, contractAddress );
  contract.setProvider( web3.currentProvider );
};

SimpleStake.prototype = {
  constructor: "SimpleStake"
  , contract: null
  , contractAddress: null
  , getUUID: function () {
    const oThis = this;

    return oThis.contract.methods.uuid().call()
      .then( uuid => {
        console.log("SimpleStake : getUUID : uuid" , uuid);
        Promise.resolve( uuid );
      });
  }
  , getEIP20Token: function () {
    const oThis = this;

    return oThis.contract.methods.uuid().call()
      .then( eip20 => {
        console.log("SimpleStake : getEIP20Token : eip20" , eip20);
        Promise.resolve( eip20 );
      });
  }


}