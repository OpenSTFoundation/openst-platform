'use strict';

/**
 * Contract interaction methods for Simple Stake <br><br>
 *
 * @module lib/contract_interact/simple_stake
 *
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/lib/web3/providers/factory');

/**
 * Constructor to create object of SimpleStakeKlass
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.contractAddress - simple Stake contract address
 *
 */
const SimpleStakeKlass = function(params) {
  const oThis = this,
    contractName = 'simpleStake',
    coreAddresses = oThis.ic().getCoreAddresses(),
    web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
    simpleStakeContractAbi = coreAddresses.getAbiForContract(contractName);

  oThis.contractAddress = params.contractAddress;

  oThis.currContract = new web3Provider.eth.Contract(simpleStakeContractAbi, oThis.contractAddress);
};

SimpleStakeKlass.prototype = {
  /**
   * Fetch all time staked amount
   *
   * @return {promise<result>}
   *
   */
  getAlltimeStakedAmount: function() {
    const oThis = this;

    const callback = async function(response) {
      if (response.isFailure()) {
        return response;
      }
      return responseHelper.successWithData({ allTimeStakedAmount: response.data.getTotalStake });
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
  _callMethod: function(methodName, args) {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      contractInteractHelper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
      btAddress = oThis.contractAddress,
      scope = oThis.currContract.methods,
      transactionObject = scope[methodName].apply(scope, args || []),
      encodeABI = transactionObject.encodeABI(),
      transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject),
      resultData = {};

    return contractInteractHelper
      .call(web3Provider, btAddress, encodeABI, {}, transactionOutputs)
      .then(function(decodedResponse) {
        return decodedResponse[0];
      })
      .then(function(response) {
        resultData[methodName] = response;
        return responseHelper.successWithData(resultData);
      })
      .catch(function(err) {
        logger.error(err);
        return responseHelper.error({
          internal_error_identifier: 'l_ci_bt_callMethod_' + methodName + '_1',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
      });
  }
};

InstanceComposer.registerShadowableClass(SimpleStakeKlass, 'getSimpleStakeInteractClass');

module.exports = SimpleStakeKlass;
