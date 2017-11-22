"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , coreConstants = require('../../config/core_constants')
  , coreAbis = require('../../config/core_abis')
  , currContractAddr = coreConstants.OST_UTILITY_TOKEN_CONTRACT_ADDR
  , currContract = new web3RpcProvider.eth.Contract(coreAbis.utilityToken)
  , responseHelper = require('../../lib/formatter/response');

const utilityTokenContractInteract = {

  getUuid: function (mcAddress) {

    const encodeABI = currContract.methods.uuid().encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodeABI, {from: mcAddress})
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_1', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({uuid: response});
      });

  }

};

module.exports = utilityTokenContractInteract;