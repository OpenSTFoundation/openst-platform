"use strict";

/*
 * Constants file
 *
 * * Author: Rachin
 * * Date: 16/10/2017
 * * Reviewed by: 
 *
 */

const reqPrefix = ".."
      ,logger = require(reqPrefix + "/helpers/CustomConsoleLogger")
      ,UtilityToken = require(reqPrefix + '/lib/bt')
      ,coreConstants = require(reqPrefix + '/config/core_constants')


const MintingIntentHandler = module.exports = function ( eventObj, stakingContract ) {
  this.setEventData( eventObj );
  this.stakingContract = stakingContract;
};

MintingIntentHandler.prototype = {
  constructor: MintingIntentHandler
  ,stakingContract : null
  
  ,timer: -1
  ,isScheduled: false

  ,eventObj: null
  ,setEventData: function ( eventObj ){
    this.eventObj = eventObj;
  }

  ,onProcessCallback: null
  ,setOnProcessCallback: function ( callback ) {
    this.onProcessCallback = callback;
  }

  ,isValid: function () {
    //Note: Always log the reason is calling an event invalid.

    if( !this.eventObj ) {
      logger.warn("Event Invalid :: eventObj is null ");
      return false;
    } 
    else if ( this.eventObj.removed ) {
      logger.warn("Event Invalid :: removed", this.getEventDescription() );
      return false;
    }

    return true;
  }
  ,scheduleProcessing: function ( timeInMilliSec ) {
    var oThis = this;
    if ( oThis.isScheduled ) {
      logger.warn("MintingIntentHandler :: scheduleProcessing :: Processing is already scheduled.", this.getEventDescription() );
      return;
    }
    oThis.isScheduled = true;
    oThis.timer = setTimeout(function () {
      oThis.processRequest();
    }, timeInMilliSec);
  }
  ,cancelProcessing: function () {
    if ( !this.isScheduled ) {
      logger.warn("MintingIntentHandler :: cancelProcessing :: Processing is NOT scheduled.", this.getEventDescription() );
      return;
    }
    clearTimeout( this.timer );
    this.isScheduled = false;
    this.timer = -1;
  }
  ,processRequest: function () {
    const oThis = this
          ,returnValues = this.eventObj.returnValues
          ,uuid                 = returnValues._uuid
          ,staker               = returnValues._staker
          ,stakerNonce          = returnValues._stakerNonce
          ,amountST             = returnValues._amountST
          ,amountUT             = returnValues._amountUT
          ,escrowUnlockHeight   = returnValues._escrowUnlockHeight
          ,mintingIntentHash    = returnValues._mintingIntentHash

          ,foundation = coreConstants.OST_FOUNDATION_ADDRESS
          ,stakingContractAddress = coreConstants.OST_STAKE_CONTRACT_ADDRESS
    ;
    if ( !this.isValid() ) {
      logger.warn("MintingIntentHandler :: processRequest :: Intent is not valid.", this.getEventDescription() );
      return;
    }
    logger.info("MintingIntentHandler :: processRequest :: Processing Started.", this.getEventDescription() );

    
    logger.step("Verifying stakingContract registrar");
    oThis.stakingContract.methods.adminAddress().call()
    .catch(  error => {
      logger.error( error.message );
      logger.log( error );
      throw "stakingContract registrar verification failed";
    })
    .then(stakeAdmin => {
      stakeAdmin = stakeAdmin.toLowerCase();
      var registrarAddress = coreConstants.OST_REGISTRAR_ADDRESS;
      if ( stakeAdmin != registrarAddress ) {
        throw "stakingContract registrar verification failed";
      }
      logger.win("stakingContract registrar verification passed");
      return true;
    })
    .then(isAdminValid => {
      logger.step("Fetching UtilityToken(ERC20) Address");
      return oThis.getStakerERC20Address( staker );
    })
    .then(utilityTokenAddress => {
      logger.win("received utilityTokenAddress", utilityTokenAddress);
      logger.step("Minting UtilityToken");
      const utilityToken = new UtilityToken(staker, utilityTokenAddress);
      return utilityToken.mint( uuid, staker, stakerNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash);
    })
    .then(mintEvent => {
      logger.win("Minting Intent has been Confirmed for mintingIntentHash" , mintingIntentHash);
      oThis.triggerProcessCallback( true );
    })
    .catch( (error) => { 
      logger.error( error.message, oThis.getEventDescription());
      //Always mark request as complete.
      oThis.triggerProcessCallback( false );
    })
  }
  ,triggerProcessCallback: function ( success ) {
    this.onProcessCallback && this.onProcessCallback( this.eventObj, success);
  }
  ,getEventDescription: function () {
    return "IntentHandler EventId: " + this.eventObj.id + " transactionHash: " + this.eventObj.transactionHash;
  }
  ,getStakerERC20Address: function ( staker ) {
    //THIS IS TEMP CODE. THE ACTUAL LOGIC NEEDS TO COME HERE. LCT - Light Coin.
    return new Promise(function (resolve,reject) {
      const Config = require( reqPrefix + '/config.json');
      var erc20 = null;
      Config.Members.some(function ( member ) {
        if ( member.Reserve.toLowerCase() == staker.toLowerCase() ) {
          erc20 = member.ERC20;
          return true;
        }
      });
      if ( erc20 ) {
        logger.info("getStakerERC20Address :: staker", staker, " found erc20", erc20 );
        resolve( erc20 );
      } else {
        reject("ERC20 not found for staker address " , staker);
      }
      
    });
  }
};


MintingIntentHandler.getMintingIntentDeclaredEventFromTransactionReceipt 
= MintingIntentHandler.getEventFromTransactionReceipt
= function ( receipt ) {
  if ( !receipt ) {
    return null;
  }
  const events = receipt.events;
  if ( !events ) {
    return null;
  }
  const mintingIntentDeclared = events.MintingIntentDeclared;
  return mintingIntentDeclared || null;
};

// //If in development, the registrar fails, uncomment and use below code.
// var transactionReceipt = {"blockHash":"0x20b469d85819b41ac4e1ba0cf8413854aa359459c80ea2a46873dc6ec16555c7","blockNumber":7806,"contractAddress":null,"cumulativeGasUsed":127886,"from":"0x553b5b43bf27bad2cb2197f7891aef6397bcf416","gasUsed":127886,"logsBloom":"0x00000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000402000000008080000000000000000000800000400400000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000010000000000006000000000000000000000020000000000000000000040000020000008800000000000000040000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000","root":"0xd6ca78e2b1e0b9974118f19666a80f9fbd79b4451105dd5065879080404312bf","to":"0xb834e21824645fd38b637da3cf1ded88c279c6d4","transactionHash":"0xbf4c8652b3a520c5427d95f70bec46aaeea20ba41719b6c4f18518aa7bac0cc2","transactionIndex":0,"events":{"0":{"address":"0xf573bDF3524dA612287e96DDc2FEb3c6921D5af7","blockNumber":7806,"transactionHash":"0xbf4c8652b3a520c5427d95f70bec46aaeea20ba41719b6c4f18518aa7bac0cc2","transactionIndex":0,"blockHash":"0x20b469d85819b41ac4e1ba0cf8413854aa359459c80ea2a46873dc6ec16555c7","logIndex":0,"removed":false,"id":"log_e69576d1","returnValues":{},"signature":null,"raw":{"data":"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0x000000000000000000000000553b5b43bf27bad2cb2197f7891aef6397bcf416","0x000000000000000000000000b834e21824645fd38b637da3cf1ded88c279c6d4"]}},"MintingIntentDeclared":{"address":"0xB834e21824645FD38B637DA3cF1ded88c279C6d4","blockNumber":7806,"transactionHash":"0xbf4c8652b3a520c5427d95f70bec46aaeea20ba41719b6c4f18518aa7bac0cc2","transactionIndex":0,"blockHash":"0x20b469d85819b41ac4e1ba0cf8413854aa359459c80ea2a46873dc6ec16555c7","logIndex":1,"removed":false,"id":"log_63639689","returnValues":{"0":"0xc015ad07a0ce24998b478572227111e0fb0d8f26fbcb0e6422e7fc15639eb7ac","1":"0x553B5b43Bf27Bad2cb2197F7891AEf6397Bcf416","2":"4","3":"1000000000000000000","4":"10000000000000000000","5":"88473","6":"0xb961a6e4cb2e2551a06d773fb1141951d486acfd00b3aa62f33744087f7b554c","_uuid":"0xc015ad07a0ce24998b478572227111e0fb0d8f26fbcb0e6422e7fc15639eb7ac","_staker":"0x553B5b43Bf27Bad2cb2197F7891AEf6397Bcf416","_stakerNonce":"4","_amountST":"1000000000000000000","_amountUT":"10000000000000000000","_escrowUnlockHeight":"88473","_mintingIntentHash":"0xb961a6e4cb2e2551a06d773fb1141951d486acfd00b3aa62f33744087f7b554c"},"event":"MintingIntentDeclared","signature":"0x705c2e746b5bfdd9b0d7a36c0721b9b96bbe8c7ee382eb2d8cadadc6a1f86a41","raw":{"data":"0x00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000000015999b961a6e4cb2e2551a06d773fb1141951d486acfd00b3aa62f33744087f7b554c","topics":["0x705c2e746b5bfdd9b0d7a36c0721b9b96bbe8c7ee382eb2d8cadadc6a1f86a41","0xc015ad07a0ce24998b478572227111e0fb0d8f26fbcb0e6422e7fc15639eb7ac","0x000000000000000000000000553b5b43bf27bad2cb2197f7891aef6397bcf416"]}}},"value":{"0":"4","1":"88471","_nonce":"4","_unlockHeight":"88471"}};

// const Web3 = require("web3")
//       ,valueChain = new Web3( coreConstants.OST_GETH_VALUE_CHAIN_WS_PROVIDER )
// ;

// const stakingContract = (function () {
//   const ContractJson = require( reqPrefix + "/contracts/Staking.json")
//         ,contractAddress = coreConstants.OST_STAKE_CONTRACT_ADDRESS
//         ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
//         ,contract = new valueChain.eth.Contract( contractAbi, contractAddress )
//   ;
//   contract.setProvider( valueChain.currentProvider );
//   return contract;
// })();


// var eventObj = MintingIntentHandler.getEventFromTransactionReceipt( transactionReceipt );
// new MintingIntentHandler(eventObj, stakingContract).scheduleProcessing( 0 );