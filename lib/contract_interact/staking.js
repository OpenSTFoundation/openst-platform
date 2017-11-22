"use strict";

const web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , coreConstants = require('../../config/core_constants')
  , coreAbis = require('../../config/core_abis')
  , currContractAddr = coreConstants.OST_STAKING_CONTRACT_ADDR
  , currContract = new web3RpcProvider.eth.Contract(coreAbis.staking)
  , responseHelper = require('../../lib/formatter/response');

const stakingContractInteract = {
  setAdminAddress: function (senderAddr, adminAddr) {

    const encodeABI = currContract.methods.setAdminAddress(adminAddr).encodeABI();

    return helper.send(web3RpcProvider, currContractAddr, encodeABI,
      { from: senderAddr, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_2', 'Something went wrong'));
      })
      .then(function (response) {
        console.log(response);
        return Promise.resolve(responseHelper.successWithData({}));
      });
  }
};

module.exports = stakingContractInteract;