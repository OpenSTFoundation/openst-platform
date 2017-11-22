"use strict";

const web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , coreConstants = require('../../config/core_constants')
  , coreAbis = require('../../config/core_abis')
  , currContractAddr = coreConstants.OST_SIMPLETOKEN_CONTRACT_ADDRESS
  , currContract = new web3RpcProvider.eth.Contract(coreAbis.staking)
  , responseHelper = require('../../lib/formatter/response');

const simpleTokenContractInteract = {

  getAdminAddress: function () {

    const encodeABI = currContract.methods.adminAddress().encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodeABI)
      .catch(function (err) {
          console.error(err);
          return responseHelper.error('ci_st_1', 'Something went wrong');
        })
        .then(function (response) {
          return responseHelper.successWithData({address: helper.toAddress(web3RpcProvider, response)});
        });

  }

};

module.exports = simpleTokenContractInteract;