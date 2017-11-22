"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , coreConstants = require('../../config/core_constants')
  , coreAbis = require('../../config/core_abis')
  , currContract = new web3RpcProvider.eth.Contract(coreAbis.utilityToken)
  , responseHelper = require('../../lib/formatter/response');

const utilityTokenContractInteract = {

  getUuid: function (memberObject) {

    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;
    const encodeABI = currContract.methods.uuid().encodeABI();

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress})
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_1', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({uuid: response});
      });

  },

  processMinting: function (memberObject, mintingIntentHash) {

    const encodeABI = currContract.methods.processMinting(mintingIntentHash).encodeABI();
    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;

    return helper.send(web3RpcProvider, btAddress, encodeABI,
                  { from: mcAddress, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_2', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({});
      });
  }

};

module.exports = utilityTokenContractInteract;