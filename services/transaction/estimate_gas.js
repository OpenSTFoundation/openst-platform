"use strict";

/**
 * Estimate gas for a transaction
 *
 * @module services/transaction/estimate_gas
*/

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

  const UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
;

/**
 * Estimate gas for a transaction service constructor
 *
 * @param {object} params
 * @param {string} params.contract_name - Name of the contract having the method which needs to be called
 * @param {string} params.contract_address - Address of the contract
 * @param {string} params.chain - Chain on which the contract was deployed
 * @param {string} params.sender_address - sender address
 * @param {string} params.method_name - name of the method which needs to be called
 * @param {string} params.method_arguments - arguments to be passed to the method
 *
 * @constructor
 */
const EstimateGasKlass = function(params) {
  const oThis = this
  ;

  oThis.contractName = params.contract_name;
  oThis.contractAddress = params.contract_address;
  oThis.chain = params.chain;
  oThis.senderAddress = params.sender_address;
  oThis.methodName = params.method_name;
  oThis.methodArguments = params.method_arguments;
};

EstimateGasKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function () {
    const oThis = this
      , web3Provider = web3ProviderFactory.getProvider(oThis.chain, 'ws')
      , abi = coreAddresses.getAbiForContract(oThis.contractName)
      , contractObj = new web3Provider.eth.Contract(abi)
      , bufferGasLimit = 10000
    ;

    contractObj.options.address = oThis.contractAddress;
    //contractObj.setProvider(web3Provider.currentProvider);

    const transactionOptions = {
      from: oThis.senderAddress,
      gasPrice: (oThis.chain === 'value') ? VC_GAS_PRICE : UC_GAS_PRICE,
      gas: (oThis.chain === 'value') ? VC_GAS_LIMIT : UC_GAS_LIMIT
    };

    const scope = contractObj.methods
      , gasToUse = await (scope[oThis.methodName].apply(scope,
      (oThis.methodArguments || []))).estimateGas(transactionOptions);

    return responseHelper.successWithData({gas_to_use: gasToUse + bufferGasLimit});
  }
};

module.exports = EstimateGasKlass;