"use strict";

/**
 * Contract interaction methods for Simple Stake <br><br>
 *
 * @module lib/contract_interact/simple_stake
 *
 */

const rootPrefix = '../..'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/value_ws')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
;

const contractName = 'simpleStake'
  , simpleStakeContractAbi = coreAddresses.getAbiForContract(contractName)
;

/**
 * Constructor to create object of SimpleStakeKlass
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.contractAddress - simple Stake contract address
 *
 */
const SimpleStakeKlass = function (params) {

  this.contractAddress = params.contractAddress;

  this.currContract = new web3Provider.eth.Contract(simpleStakeContractAbi, this.contractAddress);

  //this.currContract.setProvider(web3Provider.currentProvider);

};

SimpleStakeKlass.prototype = {

  /**
   * Fetch all time staked amount
   *
   * @return {promise<result>}
   *
   */
  getAlltimeStakedAmount: function () {

    const oThis = this;

    const callback = async function (response) {
      if (response.isFailure()) {
        return response;
      }
      return responseHelper.successWithData({allTimeStakedAmount: response.data.getTotalStake});
    };

    return oThis._callMethod('getTotalStake').then(callback);

  },

  /**
   * Wrapper method to fetch properties
   *
   * @param {string} methodName - Contract method name
   * @param {array} args - method arguments
   *
   * @return {promise<result>}
   * @ignore
   *
   */
  _callMethod: function (methodName, args) {
    const oThis = this
      , btAddress = oThis.contractAddress
      , scope = oThis.currContract.methods
      , transactionObject = scope[methodName].apply(scope, (args || []))
      , encodeABI = transactionObject.encodeABI()
      , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
      , resultData = {};

    return contractInteractHelper.call(web3Provider, btAddress, encodeABI, {}, transactionOutputs)
      .then(function (decodedResponse) {
        return decodedResponse[0];
      })
      .then(function (response) {
        resultData[methodName] = response;
        return responseHelper.successWithData(resultData);
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('l_ci_bt_callMethod_' + methodName + '_1', 'Something went wrong');
      })
      ;

  },

};

module.exports = SimpleStakeKlass;