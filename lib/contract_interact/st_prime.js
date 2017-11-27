"use strict";

const rootPrefix = '../..'
  , web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require(rootPrefix+'/lib/contract_interact/helper')
  , contractName = 'stPrime'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , coreConstants = require(rootPrefix+'/config/core_constants')
  ;

currContract.setProvider( web3RpcProvider.currentProvider );

const StPrimeContractInteract = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
}

StPrimeContractInteract.prototype = {

  initialize_transfer: async function(senderName) {
    const encodedABI = currContract.methods.initialize().encodeABI();
    const response = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(response);
  }


};