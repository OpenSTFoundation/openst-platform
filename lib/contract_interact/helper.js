"use strict";

const helper = {

  call: function (web3RpcProvider, currContractAddr, encodeABI, options) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params,options)
    }
    return web3RpcProvider.eth.call(params);
  },

  send: function (web3RpcProvider, currContractAddr, encodeABI, options) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options)
    }
    return web3RpcProvider.eth.sendTransaction(params);
  },

  sendTxAsync: function (txObj, txOptions) {
    return new Promise(function (onResolve, onReject) {
      txObj.send(txOptions)
        .on('transactionHash', onResolve)
        .on('error', onReject);
    });
  },

  safeSend: function (web3RpcProvider, txObj, txOptions) {
    return helper.sendTxAsync(txObj, txOptions).then(
      function(transactionHash){
        return helper.getTxReceipt(web3Provider, transactionHash);
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
  }

};

module.exports = helper;