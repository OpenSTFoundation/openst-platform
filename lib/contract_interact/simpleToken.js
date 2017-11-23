"use strict";

const web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'simpleToken'
  , coreConstants = require('../../config/core_constants')
  , currContractAddr = coreConstants.OST_SIMPLE_TOKEN_CONTRACT_ADDR
  , coreAddresses = require('../../config/core_addresses')
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  , responseHelper = require('../../lib/formatter/response');

const simpleTokenContractInteract = {

  getAdminAddress: function () {

    const encodeABI = currContract.methods.adminAddress().encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodeABI)
      .catch(function (err) {
          console.error(err);
          return Promise.resolve(responseHelper.error('ci_st_1', 'Something went wrong'));
        })
        .then(function (response) {
          return Promise.resolve(responseHelper.successWithData({address: helper.toAddress(web3RpcProvider, response)}));
        });

  }

};

module.exports = simpleTokenContractInteract;