"use strict";
//All Module Requires.
const BigNumber = require('bignumber.js')

;


//All other requires.
const rootPrefix    = '../..'
  , web3RpcProvider = require( rootPrefix + '/lib/web3/providers/utility_rpc')
  , helper          = require( rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses   = require( rootPrefix + '/config/core_addresses')
  , coreConstants   = require( rootPrefix + '/config/core_constants')
  , logger          = require( rootPrefix + '/helpers/custom_console_logger')
  , responseHelper  = require( rootPrefix + '/lib/formatter/response')
;

//All Constants.
const contractName  = 'stPrime'
  , contractAbi     = coreAddresses.getAbiForContract(contractName)
  , currContract    = new web3RpcProvider.eth.Contract( contractAbi )
  , UC_GAS_PRICE    = coreConstants.OST_UTILITY_GAS_PRICE
;


//Some Executions.
currContract.setProvider( web3RpcProvider.currentProvider );

const StPrimeContractInteract = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
  if ( contractAddress ){
    currContract.options.address = contractAddress;
    currContract.setProvider( web3RpcProvider.currentProvider );    
  }
  this.currContract = currContract;
};

StPrimeContractInteract.prototype = {

  initialize_transfer: async function(senderName, customOptions) {
    const encodedABI = currContract.methods.initialize().encodeABI();

    const stPrimeTotalSupplyInWei = web3RpcProvider.utils.toWei( coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY ,"ether");
    var options = { gasPrice: UC_GAS_PRICE, value:  stPrimeTotalSupplyInWei };

    Object.assign(options,customOptions);
    const response = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      options
    );

    return Promise.resolve(response);
  }

  /* 
    The methods below do not interact with the contract itself. 
    The methods below moc the behaviour of ST Prime as a branded token.
    We can move the methods below to somewhere else.
  */

  , getBalanceOf: function ( owner ) { 
    if ( !helper.isAddressValid( owner ) ) {
      return Promise.resolve(  responseHelper.error('ci_stp_1', `Invalid blockchain address: ${owner}`) );
    }
    return web3RpcProvider.eth.getBalance( owner ).then( balance => {
      return responseHelper.successWithData({balance: balance});
    });
  }

  , transfer : function ( sender, recipient, amountInWei, tag ) {
    var oThis = this;
    logger.step("STPrime :: transfer initiated");

    if ( !helper.isAddressValid( sender ) ) {
      logger.error("STPrime :: transfer :: sender address invalid");
      return Promise.resolve(  responseHelper.error('ci_stp_1_v.1', `Invalid blockchain address: ${sender}`) );
    }

    if ( !helper.isAddressValid( recipient ) ) {
      logger.error("STPrime :: transfer :: recipient address invalid");
      return Promise.resolve(  responseHelper.error('ci_stp_1_v.2', `Invalid blockchain address: ${recipient}`) );
    }

    if ( sender.toLowerCase() === recipient.toLowerCase() ) {
      logger.error("STPrime :: transfer :: sender & recipient addresses are same");
      return Promise.resolve(  responseHelper.error('ci_stp_1_v.2', `Same sender & recipient address provided. Sender: ${sender} , Recipient: ${recipient}`) ); 
    }

    if ( isNaN( Number( amountInWei ) ) ) {
      logger.error("STPrime :: transfer :: amountInWei invalid");
      return Promise.resolve(  responseHelper.error('ci_stp_1_v.3', `Invalid amountInWei: ${amountInWei}`) );
    }

    const bigAmount = new BigNumber( amountInWei );

    return oThis.getBalanceOf( sender )
      .then( response => {
        if ( !response ) {
          logger.error("STPrime :: transfer :: Failed not validate sender balance.");
          return Promise.resolve(  responseHelper.error('ci_stp_1_v.4', `Failed not validate sender balance.`) );
        } else if ( !response.isSuccess()  ) {
          logger.error("STPrime :: transfer :: Failed not validate sender balance.");
          return response;
        }

        var balance = response.data.balance;
        balance = new BigNumber( balance );

        if ( balance.lessThan( bigAmount ) ) {
          logger.error("STPrime :: transfer :: Insufficient balance.");
          return Promise.resolve(  responseHelper.error('ci_stp_1_v.5', `Insufficient balance.`) );
        }

        return _transferInChain({
          "sender"      : sender
          , "recipient" : recipient
          , "amount"    : bigAmount
          , "tag"       : tag
        });

      })
  }

  , _transferInChain: function ( transferParams ) {
    logger.info("STPrime :: _transferInChain initiated");
    const oThis               = this
          , toAddress         = transferParams.recipient
          , senderAddr        = transferParams.sender
          , value             = transferParams.amount.toString( 10 )
          , tag               = transferParams.tag
          , senderPassphrase  = oThis.getMemberPassphrase( senderAddr )
    ;

    return web3RpcProvider.eth.personal.unlockAccount( senderAddr, senderPassphrase )
      .then( _ => {
        return web3RpcProvider.eth.sendTransaction({
            from: senderAddr,
            to: toAddress,
            value: value,
            gasPrice: UC_GAS_PRICE
          })
          .then( transactionHash => {
            logger.win("STPrime :: transfer successful.\n\ttransactionHash:", transactionHash);
            return responseHelper.successWithData({transactionHash: transactionHash, tag: tag});
          })
          .catch( reason => {
            logger.error("STPrime :: _transferInChain :: Transaction failed.\n\t Reason:", JSON.stringify(resaon) );
            return Promise.resolve(  responseHelper.error('ci_stp_2_e.1', `Transaction failed`) );
          });
        ;
      })
      .catch( reason => {
        logger.error("STPrime :: _transferInChain :: Failed to unlock account.\n\t Reason:", JSON.stringify(resaon) );
        return Promise.resolve(  responseHelper.error('ci_stp_2_v.1', `Failed to unlock account`) );
      })
    ;
  }

  , newManagedAccount: function ( passphrase ) {
    return web3RpcProvider.eth.personal.newAccount( passphrase )
      .then(address => {
        return responseHelper.successWithData({
          address: address
        });
      })
      .catch( error => {
        return responseHelper.error("ci_stp_2_e.2", "Something went wrong");
      });
  }

  , newMemberManagedAccount: function () {
    //STUB METHOD.
    //Figure out various inputs required to generate passphrase.
    var input1   = ""
        ,input2  = ""
        ,input3  = ""
    ;
    const passphrase = helper.generateManagedKeyPassphrase(input1, input2, input3);
    return this.newManagedAccount( passphrase );
  }

  , getMemberPassphrase: function ( address ) {
    //STUB METHOD.
    //Figure out various inputs (based on address), required to generate passphrase.
    var input1   = ""
      , input2  = ""
      , input3  = ""
    ;

    return helper.generateManagedKeyPassphrase(input1, input2, input3);
  }

  , getUuid: function () {
    const oThis = this;

    const transactionObject = oThis.currContract.methods.uuid();
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs( transactionObject );

    return helper.call(web3RpcProvider, oThis.contractAddress, encodeABI, transactionOutputs)
      .then( decodedResponse => {
        console.log("decodedResponse", decodedResponse );
        if ( decodedResponse instanceof Array ) {
          console.log("decodedResponse IS ARRAY");
          return decodedResponse[ 0 ];
        } else {
          console.log("decodedResponse IS NOT ARRAY");
          return decodedResponse;
        }
      })
      .then(uuid => {
        return Promise.resolve(responseHelper.successWithData({uuid: uuid}));
      })
      .catch(function (err) {
        console.error(err);
        return responseHelper.error('ci_ut_4', 'Something went wrong');
      })
    ;
  }

  , claim: async function( senderAddress, senderPassphrase, beneficiaryAddress ) {
    const oThis = this;
    console.log("beneficiaryAddress", beneficiaryAddress);
    const encodedABI = oThis.currContract.methods.claim( beneficiaryAddress ).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      oThis.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: coreConstants.OST_UTILITY_GAS_PRICE }
    );

    // Returns amount that is claimed.
    return Promise.resolve(transactionReceiptResult);

  }

};