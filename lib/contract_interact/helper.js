"use strict";

const rootPrefix = '../..'
  , assert = require("assert")
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , web3EventsDecoder = require(rootPrefix+'/lib/web3/events/decoder')
  ;

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
      .then(function(response){
        console.log(response);
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
      .then(function(response){
        if ( transactionOutputs ) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);  
        } else {
          return response;
        }
      });
    
  },

  sendTxAsync: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions) {
    const senderAddr = coreAddresses.getAddressForUser(senderName)
          ,senderPassphrase = coreAddresses.getPassphraseForUser(senderName)
    ;

    return helper.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions);
  },

  sendTxAsyncFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions) { 
    const txParams = {
      from: senderAddr,
      to: currContractAddr,
      data: encodeABI
    };
    Object.assign(txParams, txOptions);

    console.log("sendTxAsyncFromAddr :: Unlock Account", senderAddr);
    return web3RpcProvider.eth.personal.unlockAccount( senderAddr, senderPassphrase)
      .then( _ => {
        var isPromiseSettled = false;
        console.log("sendTxAsyncFromAddr :: Unlocked" ,senderAddr );
        return new Promise(async function (onResolve, onReject) { 
          try {
            web3RpcProvider.eth.sendTransaction(txParams ,function (error, result) {
              //THIS CALLBACK IS IMPORTANT -> on('error') Does not explain the reason.

              console.log("sendTransaction :: callback :: error", error);
              console.log("sendTransaction :: callback :: result", result);
              if ( error ) {
                console.log("sendTxAsyncFromAddr :: sendTransaction :: error :: \n\t", error );
                !isPromiseSettled && onReject( error );
              }
            })
              .on('transactionHash', txHash => {
                console.log("sendTxAsyncFromAddr :: sendTransaction :: transactionHash :: txHash ", txHash);
                isPromiseSettled = true;
                onResolve( txHash );
              });
          } catch( ex ) {
            console.log("sendTxAsyncFromAddr :: sendTransaction :: Exception :: \n\t", JSON.stringify( ex ) );
            onReject( ex );
          }
        });
      })
      .catch( reason => {

        console.log("sendTxAsyncFromAddr :: catch :: \n\t", reason, "\n\t", JSON.stringify( reason ) );
        return Promise.reject( reason );
      });
  },

  safeSend: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions, addressToNameMap) {
    return helper.sendTxAsync(web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions)
    .then(function(transactionHash) {
        return helper.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap)
        .then(function(txReceipt) {
          if (txReceipt.gasUsed == txOptions.gasPrice) {
            console.error("safeSend used complete gas gasPrice : " + txOptions.gasPrice);
          }
          return Promise.resolve(txReceipt);
        });
      }
    );
  },

  safeSendFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions, addressToNameMap) {
    return helper.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions).then(
      function(transactionHash){
        console.log("--> addressToNameMap" , addressToNameMap);
        return helper.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap);
      }
    );
  },

  getTxReceipt: function(web3RpcProvider, transactionHash, addressToNameMap) {
    return new Promise (function(onResolve, onReject) {

      var tryReceipt = function() {
        setTimeout( function(){
            web3RpcProvider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
          },
          5000
        );
      };

      var handleResponse = function (response) {
        if (response) {
          console.log("----> addressToNameMap" , addressToNameMap);
          //clearInterval(txSetInterval);
          const web3EventsDecoderResult = web3EventsDecoder.perform(response, addressToNameMap);
          onResolve(web3EventsDecoderResult);
        } else {
          console.log('Waiting for ' + transactionHash + ' to be mined');
          tryReceipt();
        }
      };

      tryReceipt();

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
    assert.ok(/^0x[0-9a-fA-F]{40}$/.test(address), `Invalid blockchain address: ${address}`);
  },

  isAddressValid: function ( address ) {
    if ( typeof address !== "string" ) {
      return false;
    }
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  },

  generateManagedKeyPassphrase: function (...arg) {
    //STUB METHOD.
    //We will have some algorithm here to generate the passphrase based on passed arguments.
    //args will be inputs from various sources like foundation/member company/the enduser.
    return process.env.OST_MANAGED_KEY_PASSPHRASE;
  }


};

module.exports = helper;