"use strict";

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses');

const helper = {

  call: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params,options)
    }
    return web3RpcProvider.eth.call(params)
      .then(response => {
        if ( transactionOutputs ) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);  
        } else {
          return response;
        }
      });
  },

  //transactionObject is returned from call method.
  getTransactionOutputs: function ( transactionObject ) {
    return transactionObject._method.outputs;
  },

  send: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options)
    }
    
    return web3RpcProvider.eth.sendTransaction(params)
      .then(response => {
        if ( transactionOutputs ) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);  
        } else {
          return response;
        }
      });
    
  },

  sendTxAsync: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions) {
    return new Promise(async function (onResolve, onReject) {

      const senderAddr = coreAddresses.getAddressForUser(senderName)
        , senderPassphrase = coreAddresses.getPassphraseForUser(senderName)
        , txParams = {
        from: senderAddr,
        to: currContractAddr,
        data: encodeABI
      };

      await web3RpcProvider.eth.personal.unlockAccount(
        senderAddr,
        senderPassphrase
      );

      Object.assign(txParams, txOptions);

      web3RpcProvider.eth.sendTransaction(txParams)
        .on('transactionHash', onResolve)
        .on('error', onReject);
    });
  },

  safeSend: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions) {
    return helper.sendTxAsync(web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions).then(
      function(transactionHash){
        return helper.getTxReceipt(web3RpcProvider, transactionHash);
      }
    );
  },

  getTxReceipt: function(web3RpcProvider, transactionHash) {
    return new Promise (function(onResolve, onReject) {

      var txSetInterval = null;

      var handleResponse = function (response) {
        if (response) {
          clearInterval(txSetInterval);
          onResolve(response);
        } else {
          console.log('Waiting for ' + transactionHash + ' to be mined');
        }
      };

      txSetInterval = setInterval(
        function(){
          web3RpcProvider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
        },
        5000
      );

    });
  },

  toAddress: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('address', result));
    });
  },

  toString: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  toNumber: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.utils.hexToNumber(result));
    });
  },

  decodeUint256: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('uint256', result));
    });
  },

  assertAddress: function ( address ) {
    Assert.ok(/^0x[0-9a-fA-F]{40}$/.test(address), `Invalid blockchain address: ${address}`);
  }

};

module.exports = helper;