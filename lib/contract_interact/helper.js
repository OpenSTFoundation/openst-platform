"use strict";

const helper = {

  call: function (web3Provider, currContractAddr, encodeABI, options) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params,options)
    }
    return web3Provider.eth.call(params);
  },

  send: function (web3Provider, currContractAddr, encodeABI, options) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options)
    }
    return web3Provider.eth.sendTransaction(params);
  },

  toAddress: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('address', result));
    });
  },

  toString: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  toNumber: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.utils.hexToNumber(result));
    });
  },

  decodeUint256: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('uint256', result));
    });
  }

};

module.exports = helper;