'use strict';

/**
 * Estimate gas for a transaction
 *
 * @module services/transaction/estimate_gas
 */

const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/config/core_constants');

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
  const oThis = this;

  oThis.contractName = params.contract_name;
  oThis.contractAddress = params.contract_address;
  oThis.chain = params.chain;
  oThis.senderAddress = params.sender_address;
  oThis.methodName = params.method_name;
  oThis.methodArguments = params.method_arguments;
};

EstimateGasKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::perform::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 's_t_eg_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        });
      }
    });
  },

  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function() {
    const oThis = this,
      web3Provider = oThis
        .ic()
        .getWeb3ProviderFactory()
        .getProvider(oThis.chain, 'ws'),
      abi = oThis
        .ic()
        .getCoreAddresses()
        .getAbiForContract(oThis.contractName),
      contractObj = new web3Provider.eth.Contract(abi),
      bufferGasLimit = 10000;

    contractObj.options.address = oThis.contractAddress;
    //contractObj.setProvider(web3Provider.currentProvider);

    let coreConstants = oThis.ic().getCoreConstants();
    const transactionOptions = {
      from: oThis.senderAddress,
      gasPrice: oThis.chain === 'value' ? coreConstants.OST_VALUE_GAS_PRICE : coreConstants.OST_UTILITY_GAS_PRICE,
      gas: oThis.chain === 'value' ? coreConstants.OST_VALUE_GAS_LIMIT : coreConstants.OST_UTILITY_GAS_LIMIT
    };

    const scope = contractObj.methods,
      gasToUse = await scope[oThis.methodName]
        .apply(scope, oThis.methodArguments || [])
        .estimateGas(transactionOptions);

    return responseHelper.successWithData({ gas_to_use: gasToUse + bufferGasLimit });
  }
};

InstanceComposer.registerShadowableClass(EstimateGasKlass, 'getEstimateGasService');

module.exports = EstimateGasKlass;
