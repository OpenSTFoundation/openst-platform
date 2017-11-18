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