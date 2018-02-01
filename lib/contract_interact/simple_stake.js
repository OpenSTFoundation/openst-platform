"use strict";

/**
 *
 * Contract interaction methods for Simple Stake Contract.<br><br>
 *
 * @module lib/contract_interact/simple_stake
 *
 */

const rootPrefix = '../..'
  , web3 = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const simpleStakeContractName = 'simpleStake'
  , simpleStakeContractAbi = coreAddresses.getAbiForContract(simpleStakeContractName)
;


/**
 * Simple Stake Contract constructor
 *
 * @constructor
 *
 * @param {String} contractAddress - address where Contract has been deployed
 */
const SimpleStakeKlass = function (contractAddress) {
  this.contractAddress = contractAddress;

  const contract = this.contract = new web3.eth.Contract(simpleStakeContractAbi, contractAddress);
  contract.setProvider(web3.currentProvider);
};

SimpleStakeKlass.prototype = {
  constructor: "SimpleStake",

  contract: null,

  contractAddress: null,

  /**
   * Get UUID
   *
   * @return {promise}
   *
   */
  getUUID: function () {
    const oThis = this;

    return oThis.contract.methods.uuid().call()
      .then(uuid => {
        logger.info("SimpleStake : getUUID : uuid", uuid);
        Promise.resolve(uuid);
      });
  },

  /**
   * Get eip20Token
   *
   * @return {promise}
   *
   */
  getEIP20Token: function () {
    const oThis = this;

    return oThis.contract.methods.eip20Token().call()
      .then(eip20 => {
        logger.info("SimpleStake : getEIP20Token : eip20", eip20);
        Promise.resolve(eip20);
      });
  }
};

module.exports = SimpleStakeKlass;