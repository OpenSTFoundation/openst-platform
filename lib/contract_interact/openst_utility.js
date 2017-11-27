"use strict";

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , helper = require(rootPrefix+'/lib/contract_interact/helper')
  , contractName = 'openSTUtility'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  ;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpenStUtilityContractInteract = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
};

OpenStUtilityContractInteract.prototype = {

  getSimpleTokenPrimeContractAddress: async function(){
    const encodedABI = currContract.methods.simpleTokenPrime().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodeABI);
    return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response}));
  },

  getSimpleTokenPrimeUUID: async function(){
    console.log("currContract.methods.uuidSTPrime()");
    console.log(currContract.methods.uuidSTPrime());
    const encodedABI = currContract.methods.uuidSTPrime().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodeABI);
    return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response}));
  },

  initiateOwnerShipTransfer: async function(senderName, proposedOwner){
    console.log("initiateOwnerShipTransfer proposedOwner: "+ proposedOwner);
    const encodedABI = currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();
    const response = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(response);

  },

  processMinting: async function(reserveAddress, reservePassphrase, stakingIntentHash){

    const encodedABI = currContract.methods.processMinting(stakingIntentHash).encodeABI();

    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      reserveAddress,
      reservePassphrase,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    //return => tokenAddress;
    return Promise.resolve(transactionReceipt);

  }


};