"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , contractName = 'utilityToken'
  , coreConstants = require('../../config/core_constants')
  , coreAddresses = require('../../config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require('../../lib/formatter/response')
  , registrarAddress = coreConstants.OST_REGISTRAR_ADDR
  , registrarKey = coreConstants.OST_REGISTRAR_PASSPHRASE
  , cache = require("../cache")
  , uuid = require('uuid')
  , BigNumber = require("bignumber.js")
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

  _getCacheKeyForBalance: function ( address ) { 
    return this._getBTSymbol() + "_balance_" + address.toLowerCase();
  },

  getName: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "name" );

    return cache.get( cache_key )
      .then( response => {
        if ( response ) {
          return response;
          
        } else {

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
      .then(function (response) {
        return responseHelper.successWithData({name: response});
      })
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_1', 'Something went wrong'));
      })
    ;
  },

  getSymbol: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "symbol" );
    return cache.get( cache_key )
      .then( response => {
        if ( response ) {
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
      .then(function (response) {
        return responseHelper.successWithData({symbol: response});
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_2', 'Something went wrong');
      })
    ;
  },

  getDecimals: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "decimals" );
    return cache.get( cache_key )
      .then( response => {
        if ( response ) {
          console.log("getDecimals cache hit");
          return response;
        } else {
          console.log("getDecimals cache miss");
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
      .then(function (response) {
        return responseHelper.successWithData({decimals: response});
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_3', 'Something went wrong');
      })
    ;
  },

  getUuid: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "uuid" );
    return cache.get( cache_key )
      .then( response => {
        if ( response ) {
          console.log("getUuid cache hit");
          return response;
        } else {
          console.log("getUuid cache miss");
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
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({uuid: response}));
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_4', 'Something went wrong');
      })
    ;
  },

  //Note: totalSupply is not cached, as the totalSupply can increase/decrease on stake/unstake
  getTotalSupply: function () {
    const oThis = this;
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
        return responseHelper.successWithData({totalSupply: totalSupply});
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_5', 'Something went wrong');
      })
    ;
  },

  //Note: Allowance is not cached, as the allowance allocation happens from outside.
  getAllowance: function(owner, spender) {
    const oThis = this
          ,isOwnerValid = helper.isAddressValid( owner )
          ,isSpenderValid = helper.isAddressValid( spender )
    ;

    if ( !isOwnerValid || !isSpenderValid ) {
      return new Promise( (resolve,reject) => {
        var invalidAddress;
        if ( !isOwnerValid ) {
          invalidAddress = owner;
        } else {
          invalidAddress = spender;
        }
        resolve( responseHelper.error('ci_ut_6', `Invalid blockchain address: ${invalidAddress}`) );
      });
    }

    
    const mcAddress = oThis._getMemberReserve();
    const btAddress = oThis._getBTAddress();

    const transactionObject = currContract.methods.allowance(owner, spender);
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs( transactionObject );

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
      .then( decodedResponse => {
        return decodedResponse[ 0 ];
      })
      .then(function (allowance) {
        return responseHelper.successWithData({allowance: allowance});
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_6', 'Something went wrong');
      })
    ;

  },

  getBalanceOf: function ( owner ) {
    const oThis = this
          ,isOwnerValid = helper.isAddressValid( owner )
    ;

    //Validation
    if ( !isOwnerValid  ) {
      return new Promise( (resolve,reject) => {
        resolve( responseHelper.error('ci_ut_7', `Invalid blockchain address: ${owner}`) );
      });
    }

    const cache_key = oThis._getCacheKeyForBalance( owner );
    return cache.get( cache_key )
      .then( cachedBalance => {
        if ( cachedBalance ) {
          console.log("balance cache hit");
          return cachedBalance;
        } else {
          console.log("balance cache miss");
          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = currContract.methods.balanceOf(owner);
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              //Decode the response
              return decodedResponse[ 0 ];
            })
            .then(balance => {
              //To-Do: Ensure cache is empty. 
              //Someone else might have already fetched it and may be performing operations.
              //Aquire lock ?

              //Cache it
              cache.set(cache_key, balance );
              return balance;
            })
          ;
        }
      })
      .then(balance => {
        //Format the response
        return responseHelper.successWithData({balance: balance});
      })
      .catch(function (err) {
        //Format the error
        console.error(err);
        return responseHelper.error('ci_ut_7', 'Something went wrong');
      })

    ;
  },

  transfer: function ( sender, recipient, amountInWei, tag ) {
    const oThis = this;

    //Basic Validation
    //..Validate sender address
    if ( !helper.isAddressValid( sender ) ) {
      return Promise.resolve( responseHelper.error('ci_ut_8.v.1', `Invalid blockchain address: ${sender}`) );
    } 

    //..Validate recipient address
    if ( !helper.isAddressValid( recipient ) ) {
      //Invalid Recipient Address
      return Promise.resolve( responseHelper.error('ci_ut_8.v.2', `Invalid blockchain address: ${recipient}`) );
    } 

    //..Prepare amount for validation.
    var bigNumAmount = null;
    if ( amountInWei instanceof BigNumber ) {
      bigNumAmount = amountInWei;
    } else {
      //Try to conver amountInWei into BigNumber.
      var numAmount = Number( amountInWei )
      if ( !isNaN( numAmount ) ) {
        bigNumAmount = new BigNumber( amountInWei );
      }
    }

    //..Validate Transfer Amount.
    if ( !bigNumAmount || bigNumAmount.lessThan( 0 ) ) {
      return Promise.resolve( responseHelper.error('ci_ut_8.v.4', `Invalid tramsfer amount: ${amountInWei}`) );
    }

    const senderBalancePromise = oThis.validateBalance(sender, bigNumAmount)
          ,recipientBalancePromise = oThis.validateBalance(sender, new BigNumber( 0 ) )
    ;

    //Fetch balances in parallel.
    return Promise.all([senderBalancePromise, recipientBalancePromise])
      .then( responses => {
        const senderResponse = responses[ 0 ]
              ,recipientResponse = responses[ 1 ]
        ;
        if ( !senderResponse.success ) {
          //Insufficient Sender Balance or Failed to fetch balance.
          return senderResponse;
        }

        if ( !recipientResponse.success ) {
          //Failed to fetch balance.
          return responseHelper.error('ci_ut_8.v.5', 'Something went wrong');
        }

        //Generate Transaction Receipt
        const txUUID = uuid.v4()

        const transferParams = {
          "transactionUUID" : txUUID
          ,"transactionType": "transfer"
          ,"sender": sender
          ,"recipient": recipient
          ,"amount": bigNumAmount
          ,"tag": tag
        };

        //Update Cache
        const cacheSenderPromise      = oThis._debitBalanceInCache( sender, bigNumAmount )
              ,cacheRecipientPromise  = oThis._creditBalanceInCache( recipient, bigNumAmount )
        ;
        
        //Update Chain
        const fundAndTransferPromise = oThis._fundSenderForTransferIfNeeded( transferParams )
          .then( response => {
            if ( response.isSuccess() ) {
              return oThis._transferInChain( transferParams )
                .then( response => {
                  if ( response.isSuccess() ) {
                    console.log("!!!!! TRASFER SUCCESSFUL !!!!!");
                  } else {
                    throw "Transaction failed"; //Trigger Rollback.
                  }
                })
              ;  
            }
            return response;
          })
          .catch( err => {
            //Rollback Cache.
            console.log("Rollback Transfer");
            //..Credir back to sender.
            oThis._creditBalanceInCache( sender, bigNumAmount );

            //..Debit back from recipient.
            oThis._debitBalanceInCache( recipient, bigNumAmount );
          })
        ;

        //Dont wait for promise to resolve, let it happen in background.
        return responseHelper.successWithData( transferParams );
      });
  },

  _creditBalanceInCache: function ( owner, bigAmount ) {
    const oThis = this;

    console.log("_creditBalanceInCache called for", owner, "\nbigAmount", bigAmount.toString( 10 ) );

    return oThis.getBalanceOf( owner )
      .then( response => {
        if ( response.isSuccess() ) {

          var balance = response.data.balance;
          var bigBalance = new BigNumber( balance );
          bigBalance = bigBalance.plus( bigAmount );

          console.log("_debitBalanceInCache :: balance" , balance, "new balance", bigBalance.toString( 10 ) );
          
          const owenrKey = oThis._getCacheKeyForBalance( owner );
          return cache.set(owenrKey, bigBalance.toString( 10 ) )
            .then( success => {
              if ( success ) {
                return responseHelper.successWithData({});
              }
              return responseHelper.error('ci_ut_9', 'Something went wrong')
            })
          ;
        }
        return response;
      })
    ;
  },

  _debitBalanceInCache: function ( owner, bigAmount ) {
    const oThis = this;

    console.log("_debitBalanceInCache called for", owner, "\n\tbigAmount", bigAmount.toString( 10 ) );

    return oThis.getBalanceOf( owner )
      .then( response => {
        if ( response.isSuccess() ) {

          var balance = response.data.balance;
          var bigBalance = new BigNumber( balance );
          bigBalance = bigBalance.minus( bigAmount );

          console.log("_debitBalanceInCache :: balance" , balance, "new balance", bigBalance.toString( 10 ) );
          
          const owenrKey = oThis._getCacheKeyForBalance( owner );
          return cache.set(owenrKey, bigBalance.toString( 10 ) )
            .then( success => {
              if ( success ) {
                return responseHelper.successWithData({});
              }
              return responseHelper.error('ci_ut_10', 'Something went wrong')
            })
          ;
        }
        return response;
      })
    ;
  },

  _fundSenderForTransferIfNeeded: function ( transferParams ) {
    const oThis = this;

    return Promise.resolve( responseHelper.successWithData({transferParams: transferParams}) );
  },

  _transferInChain: function ( transferParams ) {
    const oThis = this;

    const toAddress         = transferParams.recipient
          ,senderAddr       = transferParams.sender
          ,value            = transferParams.amount.toString( 10 )
          ,senderPassphrase = "" /* Comming Soon */
    ;

    const btAddress = oThis._getBTAddress();

    const transactionObject = currContract.methods.transfer(toAddress, value);
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs( transactionObject );

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: senderAddr}, transactionOutputs)
      .then(_ => {
        console.log("_transferInChain CALL Successful");
        return helper.safeSendFromAddr(web3RpcProvider, btAddress, encodeABI, senderAddr, senderPassphrase, {from: senderAddr, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
          .then( transactionReceipt => {
            console.log("_transferInChain SEND Successful");
            return responseHelper.successWithData({
              "transactionReceipt": transactionReceipt
              ,"transferParams": transferParams
            });
          })
        ;
      })
    ;

  },


  validateBalance: function (owner, bigMinAmount ) {
    const oThis = this;

    return oThis.getBalanceOf( owner )
      .then( response => {
        if ( !response ) {
          //Unexpected Error. Please debug getBalanceOf.
          return responseHelper.error('ci_ut_9.u.1', 'Something went wrong');
        } else if ( !response.success ) {
          //An error occoured while fetching balance.
          return response;
        } else if ( !response.data ) {
          //Unexpected Error. Please debug getBalanceOf.
          return responseHelper.error('ci_ut_9.u.2', 'Something went wrong');
        }

        var balance = response.data.balance;
        if ( typeof balance === "undefined" || isNaN( Number(balance) ) ) {
          //Unexpected Error. Please debug getBalanceOf.
          return responseHelper.error('ci_ut_9.u.3', 'Something went wrong');
        }

        var bigNumBalance = new BigNumber( balance );
        if ( bigNumBalance.lessThan( bigMinAmount ) ) {
          //Insufficient funds.
          return responseHelper.error('ci_ut_9.v.1', 'Insufficient Funds');
        }

        return responseHelper.successWithData({ 
          "balance" : balance
          ,"bigNumBalance" : bigNumBalance
        });
      })
    ;
  },



  getOwner: function () {
    const oThis = this;
    const cache_key = oThis._getCacheKeyForProperty( "owner" );

    return cache.get( cache_key )
      .then( response => {
        if ( response ) {
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
      .then(function (response) {
        console.log(response);
        return responseHelper.successWithData({owner: response});
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_7', 'Something went wrong');
      })
    ;
  },




  processMinting: function (memberObject, mintingIntentHash) {

    const encodeABI = currContract.methods.processMinting(mintingIntentHash).encodeABI();
    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;



    return helper.send(web3RpcProvider, btAddress, encodeABI,
                  { from: mcAddress, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
      .catch(function (err) {
        //The catch should always be the last block in the chain.
        //When placed as the last block it acts as catch all.
        //Please move it after then. Catch bolck does not break the promise chain.
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
            //The catch should always be the last block in the chain.
            //When placed as the last block it acts as catch all.
            //Please move it after then. Catch bolck does not break the promise chain.
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

