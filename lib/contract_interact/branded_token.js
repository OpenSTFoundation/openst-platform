"use strict";

//All Module Requires.
const uuid    = require('uuid')
  , BigNumber = require('bignumber.js')
;

//All the requires.
const rootPrefix    = '../..'
  , web3RpcProvider = require( rootPrefix + '/lib/web3/providers/utility_rpc' )
  , helper          = require( rootPrefix + '/lib/contract_interact/helper' )
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , coreAddresses   = require( rootPrefix + '/config/core_addresses' )
  , responseHelper  = require( rootPrefix + '/lib/formatter/response' )
  , cache           = require( rootPrefix + '/lib/cache' )  
  , logger          = require( rootPrefix + '/helpers/custom_console_logger' )
  , StPrimeKlass    = require( rootPrefix + '/lib/contract_interact/st_prime' )
;

//Constants
const contractName        = 'brandedToken'
  , contractAbi           = coreAddresses.getAbiForContract(contractName)
  , registrarAddress      = coreAddresses.getAddressForUser('valueRegistrar')
  , registrarKey          = coreAddresses.getPassphraseForUser('valueRegistrar')
  // , stPrimeAddress        = coreAddresses.getAddressesForContract( "stPrime" )
  , stPrimeAddress        = null
  , stPrime               = new StPrimeKlass( stPrimeAddress )
  , stPrimeTransferFactor = 3
;

const BrandedTokenContractInteract = module.exports = function ( memberObject ) {
  this.memberObject = memberObject;
  this.currContract = new web3RpcProvider.eth.Contract( contractAbi, this._getBTAddress() );
  this.currContract.setProvider( web3RpcProvider.currentProvider );
};

BrandedTokenContractInteract.prototype = {

  currContract: null,
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

  getWeb3Provider: function () {
    return web3RpcProvider;
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
          
          const transactionObject = oThis.currContract.methods.name();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs( transactionObject );

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then( decodedResponse => {
              console.log("decodedResponse" , decodedResponse);
              return decodedResponse[ 0 ];
            })
            .then(name => {
              console.log("name" , name);
              cache.set(cache_key, name );
              return name;
            });
        }
      })
      .then(function (response) {
        console.log("response" , JSON.stringify( response ) );
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

          const transactionObject = oThis.currContract.methods.symbol();
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

          const transactionObject = oThis.currContract.methods.decimals();
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

          const transactionObject = oThis.currContract.methods.uuid();
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
          
    const transactionObject = oThis.currContract.methods.totalSupply();
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

    const transactionObject = oThis.currContract.methods.allowance(owner, spender);
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

          const transactionObject = oThis.currContract.methods.balanceOf(owner);
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

              //This code uses internal methods and MUST change.
              //It ensures cache is empty before setting cache.
              var existingRecord = cache._getRecord( cache_key );
              if ( existingRecord ) {
                //Ignore the balance we already have.
                return existingRecord.getValue();
              }

              //Cache it
              cache.set(cache_key, balance );
              return balance;
            })
            .catch( resson => {

              //This code uses internal methods and MUST change.
              //It ensures that if value is returned if it is present in cache.
              var existingRecord = cache._getRecord( cache_key );
              if ( existingRecord ) {
                //Ignore the exception, we already have balance in cache.
                return existingRecord.getValue();
              }

              //We can't help. throw again.
              throw resson;
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
        const cacheSenderPromise      = oThis._debitBalanceInCache( sender, bigNumAmount );

        const transactionObject = oThis.currContract.methods.transfer(recipient, bigNumAmount.toString( 10 ) );

        const rollbackFn = function ( response ) {
          logger.error("=====Transaction Failed. Rollback Transfer =====");
          logger.info("response:\n", JSON.stringify( response ) );
          logger.info("transferParams:\n", transferParams);
          //..Credit back to sender.
          oThis._creditBalanceInCache( sender, bigNumAmount );
          return response;
        };

        //Update Chain
        oThis._fundSenderForTransferIfNeeded( transferParams, transactionObject )
          .then( response => {
            if ( response.isSuccess() ) {
              return oThis._transferInChain( transferParams, transactionObject )
                .then( response => {
                  if ( response.isSuccess() ) {
                    logger.win("Transaction is successful. transferParams:\n", JSON.stringify( transferParams) );
                    //Credit the amount to the recipient.
                    oThis._creditBalanceInCache( recipient, bigNumAmount );
                  } else {
                    logger.warn("BT :: transfer :: _transferInChain failed");
                    return rollbackFn( response );
                  }
                })
              ;  
            } else {
              logger.warn("BT :: transfer :: failed to fund sender");
              return rollbackFn( response );
            }
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

  _fundSenderForTransferIfNeeded: async function ( transferParams, transactionObject ) {

    logger.info("_fundSenderForTransferIfNeeded initiated");
    const oThis       = this
      , reserve       = oThis._getMemberReserve()
      , senderAddr    = transferParams.sender
    ;

    var estimatedGas = await transactionObject.estimateGas();
    estimatedGas = new BigNumber( estimatedGas );
    logger.info("_fundSenderForTransferIfNeeded : estimatedGas = ", estimatedGas);

    const senderBalanceResponse = await stPrime.getBalanceOf( senderAddr );
    if ( !senderBalanceResponse.isSuccess() ) {
      logger.error("_fundSenderForTransferIfNeeded: Failed to validate STPrime balance of sender");
      return Promise.resolve( senderBalanceResponse );  
    }

    const senderBalance = new BigNumber ( senderBalanceResponse.data.balance );

    if ( estimatedGas.lessThan( senderBalance ) ) {
      logger.info("_fundSenderForTransferIfNeeded: Sender already has sufficient STPrime");
      return Promise.resolve( 
        responseHelper.successWithData({
          transferParams: transferParams, 
          estimatedGas: estimatedGas.toString( 10 ) 
        }))
      ;
    }

    if ( reserve.toLowerCase() === senderAddr.toLowerCase() ) {
      logger.error("_fundSenderForTransferIfNeeded : Member company does not have sufficient STPrime to perform transfer");
      return Promise.resolve( responseHelper.error('ci_ut_10', 'Insufficient gas to perform transfer') );  
    }

    const stPrimeToTransfer = estimatedGas.times( stPrimeTransferFactor );

    return stPrime.transfer( reserve, senderAddr, stPrimeToTransfer, "Funding member for BT transfer");
  },

  _transferInChain: function ( transferParams, transactionObject ) {
    const oThis = this;

    const toAddress         = transferParams.recipient
          ,senderAddr       = transferParams.sender
          ,value            = transferParams.amount.toString( 10 )
          ,senderPassphrase = oThis.getPassphrase( senderAddr )
    ;

    const btAddress = oThis._getBTAddress();
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs( transactionObject );

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: senderAddr}, transactionOutputs)
      .then(_ => {
        console.log("_transferInChain CALL Successful");
        return helper.sendTxAsyncFromAddr(
          web3RpcProvider,
          btAddress,
          encodeABI,
          senderAddr,
          senderPassphrase,
          {from: senderAddr, gasPrice: coreConstants.OST_UTILITY_GAS_PRICE}
          )
          .then( transactionHash => {
            console.log("_transferInChain SEND Successful");
            return responseHelper.successWithData({
              "transactionHash": transactionHash
              ,"transferParams": transferParams
            });
          })
          .catch( reason => {
            console.log("_transferInChain SEND Failed!");
            console.log("reason" , JSON.stringify( reason ) );
            return responseHelper.error('ci_ut_10', 'Transaction Failed');
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

  getReserve: function () {
    const oThis = this;
    const mcAddress = oThis._getMemberReserve();
    return Promise.resolve( responseHelper.successWithData({reserve: mcAddress}) );
  },

  processMinting: function (memberObject, mintingIntentHash) {

    const oThis = this;
    const encodeABI = oThis.currContract.methods.processMinting(mintingIntentHash).encodeABI();
    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;

    return helper.send(web3RpcProvider, btAddress, encodeABI,
                  { from: mcAddress, gasPrice: coreConstants.OST_UTILITY_GAS_PRICE})
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

    const oThis = this;

    Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
    Assert.strictEqual(typeof minter, 'string', `minter must be of type 'string'`);
    Assert.strictEqual(typeof mintingIntentHash, 'string', `mintingIntentHash must be of type 'string'`);
    Assert.ok(amountST > 0, "amountST should be greater than 0");
    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    const encodeABI = oThis.currContract.methods.mint(uuid, minter, minterNonce, amountST, amountUT,
      escrowUnlockHeight, mintingIntentHash).encodeABI();

    return web3RpcProvider.eth.personal.unlockAccount( registrarAddress, registrarKey)
        .then(_ => {
          return helper.send(web3RpcProvider, btAddress, encodeABI,
            { from: REGISTRAR_ADDRESS, gasPrice: coreConstants.OST_UTILITY_GAS_PRICE }
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
  },

  newUserAccount: function () {
    //STUB METHOD.
    //Figure out various inputs required to generate passphrase.
    var input1   = ""
      , input2  = ""
      , input3  = ""
    ;
    const passphrase = helper.generateManagedKeyPassphrase(input1, input2, input3);
    return stPrime.newManagedAccount( passphrase );
  },

  getUserPassphrase: function ( address ) {
    //STUB METHOD.
    //Figure out various inputs (based on address), required to generate passphrase.
    var input1   = ""
      , input2  = ""
      , input3  = ""
    ;

    return helper.generateManagedKeyPassphrase(input1, input2, input3);
  },

  getPassphrase: function ( address ) {
    const oThis = this;
    const mcAddress = oThis._getMemberReserve();

    address = String( address );
    if( address.toLowerCase() === mcAddress.toLowerCase() ) {
      return stPrime.getMemberPassphrase( address );
    } else {
      return oThis.getUserPassphrase( address );
    }
  },

  claim: async function( senderAddress, senderPassphrase, beneficiaryAddress ) {

    const oThis = this;
    const encodedABI = oThis.currContract.methods.claim( beneficiaryAddress ).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      oThis._getBTAddress(),
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: coreConstants.OST_UTILITY_GAS_PRICE }
    );

    // Returns amount that is claimed.
    return Promise.resolve(transactionReceiptResult);

  }





};

