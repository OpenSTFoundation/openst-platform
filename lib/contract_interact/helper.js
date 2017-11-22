"use strict";

const helper = {

  call: function (web3Provider, currContractAddr, encodeABI) {
    return web3Provider.eth.call({
      to: currContractAddr,
      data: encodeABI
    });
  },

  toAddress: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('address', result));
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