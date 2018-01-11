"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on SimpleStake Contract.<br><br>
 *
 * @module lib/contract_interact/simple_stake
 *
 */

const rootPrefix = "../.."
  , web3 = require(rootPrefix+"/lib/web3/providers/value_rpc")
  , helper = require(rootPrefix + "/lib/contract_interact/helper")
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , coreAddresses = require(rootPrefix+"/config/core_addresses")
  , responseHelper = require(rootPrefix+"/lib/formatter/response")
  , contractName = "simpleStake"
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * @constructor
 *
 * @param {String} contractAddress - address where Contract has been deployed
 *
 */
const SimpleStake = module.exports = function (contractAddress) { 
  this.contractAddress = contractAddress;
  const contract = this.contract = new web3.eth.Contract( contractAbi, contractAddress );
  contract.setProvider( web3.currentProvider );
};

SimpleStake.prototype = {
  constructor: "SimpleStake"
  , contract: null
  , contractAddress: null

  /**
   * Get UUID
   *
   * @return {Promise}
   *
   */
  , getUUID: function () {
    const oThis = this;

    return oThis.contract.methods.uuid().call()
      .then( uuid => {
        logger.info("SimpleStake : getUUID : uuid" , uuid);
        Promise.resolve( uuid );
      });
  }

  /**
   * Get eip20Token
   *
   * @return {Promise}
   *
   */
  , getEIP20Token: function () {
    const oThis = this;

    return oThis.contract.methods.eip20Token().call()
      .then( eip20 => {
        logger.info("SimpleStake : getEIP20Token : eip20" , eip20);
        Promise.resolve( eip20 );
      });
  }


}