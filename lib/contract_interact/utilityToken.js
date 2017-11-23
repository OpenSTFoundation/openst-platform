"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , contractName = 'utilityToken'
  , coreConstants = require('../../config/core_constants')
  , coreAddresses = require('../../config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require('../../lib/formatter/response')
  , registrarAddress = coreConstants.OST_REGISTRAR_ADDRESS
  , registrarKey = coreConstants.OST_REGISTRAR_SECRET_KEY
  , cache = require("../cache")
;

currContract.setProvider( web3RpcProvider.currentProvider );

const UtilityTokenContractInteract = module.exports = function ( memberObject ) {
  this.memberObject = memberObject;
}

UtilityTokenContractInteract.prototype = {
  memberObject: null,
  /**
   * Internal Method. Returns Reserve Address mentioned in config.
  */
  _getMemberReserve: function () {
    return this.memberObject.Reserve;
  },

  /**
   * Internal Method. Returns ERC20 Address mentioned in config.
  */
  _getBTAddress: function () {
    return this.memberObject.ERC20;
  },

  /**
   * Internal Method. Returns ERC20 Address mentioned in config.
  */
  _getBTSymbol: function () {
    return this.memberObject.Symbol;
  },

  /**
   * Internal Method. Returns key name to be used for caching properties of ERC20 contract like 
   * name, symbol, decimals, reserve etc.
  */
  _getCacheKeyForProperty: function ( propName ) {
    return this._getBTSymbol() + "_prop_" + propName;
  },

  getName: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "name" );

    return cache.get( cache_key )
      .then( response => {
        if ( response && response.length > 0 ) {
          return response;
          
        } else {
          console.log("currContract.methods.name" , currContract.methods.name.outputs);
          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();
          
          const transactionObject = currContract.methods.name();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              return decodedResponse[ 0 ];
            })
            .then(name => {
              cache.set(cache_key, name );
              return name;
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_1', 'Something went wrong'));
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({name: response});
      });
  },

  getSymbol: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "symbol" );
    return cache.get( cache_key )
      .then( response => {
        if ( response && response.length > 0 ) {
          return response;
        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = currContract.methods.symbol();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              return decodedResponse[ 0 ];
            })
            .then(symbol => {
              cache.set(cache_key, symbol );
              return symbol;
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_2', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({symbol: response});
      });
  },

  getDecimals: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "decimals" );
    return cache.get( cache_key )
      .then( response => {
        if ( response && response.length > 0 ) {
          return response;
        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = currContract.methods.decimals();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              return decodedResponse[ 0 ];
            })
            .then(decimals => {
              cache.set(cache_key, decimals );
              return decimals;
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_3', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({decimals: response});
      });
  },

  getUuid: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "uuid" );
    return cache.get( cache_key )
      .then( response => {
        if ( response && response.length > 0 ) {
          return response;
        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = currContract.methods.uuid();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              return decodedResponse[ 0 ];
            })
            .then(uuid => {
              cache.set(cache_key, uuid );
              return uuid;
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_4', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({uuid: response});
      });
  },

  getTotalSupply: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "totalSupply" );
    return cache.get( cache_key )
      .then( response => {
        if ( response && response.length > 0 ) {
          return response;
        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();
          
          const transactionObject = currContract.methods.totalSupply();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              return decodedResponse[ 0 ];
            })
            .then(totalSupply => {
              cache.set(cache_key, totalSupply );
              return totalSupply;
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_5', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({totalSupply: response});
      });
  },

  getAllowance: function(owner, spender) {
    const oThis = this;
    //Ensure owner and spender are valid addresses.
    helper.assertAddress( owner );
    helper.assertAddress( spender );

    const mcAddress = oThis._getMemberReserve();
    const btAddress = oThis._getBTAddress();

    const transactionObject = currContract.methods.allowance(owner, spender);
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs( transactionObject );

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
      .then( decodedResponse => {
        return decodedResponse[ 0 ];
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_6', 'Something went wrong');
      })
      .then(function (allowance) {
        return responseHelper.successWithData({allowance: allowance});
      });
  },

  getOwner: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "owner" );

    return cache.get( cache_key )
      .then( response => {
        if ( response && response.length > 0 ) {
          return response;
          
        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();


          const transactionObject = currContract.methods.owner();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              return decodedResponse[ 0 ];
            })
            .then( address => {
              console.log("address" , address);
              cache.set(cache_key, address );
              return address;
            })
          ;
        }
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_6', 'Something went wrong');
      })
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({owner: response});
      });
  },




  processMinting: function (memberObject, mintingIntentHash) {

    const encodeABI = currContract.methods.processMinting(mintingIntentHash).encodeABI();
    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;

    return helper.send(web3RpcProvider, btAddress, encodeABI,
                  { from: mcAddress, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_2', 'Something went wrong'));
      })
      .then(function (response) {
        console.log(response);
        return Promise.resolve(responseHelper.successWithData({}));
      });
  },

  mint: function(btAddress, uuid, minter, minterNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash) {

    Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
    Assert.strictEqual(typeof minter, 'string', `minter must be of type 'string'`);
    Assert.strictEqual(typeof mintingIntentHash, 'string', `mintingIntentHash must be of type 'string'`);
    Assert.ok(amountST > 0, "amountST should be greater than 0");
    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    const encodeABI = currContract.methods.mint(uuid, minter, minterNonce, amountST, amountUT,
      escrowUnlockHeight, mintingIntentHash).encodeABI();

    return web3RpcProvider.eth.personal.unlockAccount( registrarAddress, registrarKey)
        .then(_ => {
          return helper.send(web3RpcProvider, btAddress, encodeABI,
            { from: REGISTRAR_ADDRESS, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
          ).catch(function (err) {
            console.error(err);
            return Promise.resolve(responseHelper.error('ci_ut_3', 'Something went wrong'));
          })
          .then(function (response) {
            console.log(response);
            return Promise.resolve(responseHelper.successWithData({response: response}));
          })
      });
  }

};

