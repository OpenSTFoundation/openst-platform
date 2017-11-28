"use strict";

const rootPrefix = '../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , utilityTokenContractInteractKlass = require(rootPrefix+'/lib/contract_interact/utilityToken')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , registrarAddress = coreAddresses.getAddressForUser('utilityRegistrar')
  ;

// contructor
const EventProcessor = module.exports = function (eventObj, stakingContract) {
  this.setEventData( eventObj );
  this.stakingContract = stakingContract;
};

EventProcessor.prototype = {

  constructor: EventProcessor,

  setEventData: function(eventObj){
    this.eventObj = eventObj;
  },

  stakingContract : null,

  // we will process the event after 90 seconds
  eventProcessingDelay: 90000,

  timer: -1,

  isScheduled: false,

  eventObj: null,

  onProcessCallback: null,

  setOnProcessCallback: function ( callback ) {
    this.onProcessCallback = callback;
  },

  isValid: function () {
    //Note: Always log the reason is calling an event invalid.

    if( !this.eventObj ) {
      logger.warn("Event Invalid :: eventObj is null ");
      return false;
    } else if ( this.eventObj.removed ) {
      logger.warn("Event Invalid :: removed", this.getEventDescription() );
      return false;
    }

    return true;
  },

  scheduleProcessing: function() {
    var oThis = this;
    if ( oThis.isScheduled ) {
      logger.warn("EventProcessor :: scheduleProcessing :: Processing is already scheduled.", this.getEventDescription() );
      return;
    }
    oThis.isScheduled = true;
    // oThis.processRequest();
    oThis.timer = setTimeout(function () {
      oThis.processRequest();
    }, oThis.eventProcessingDelay);
  },

  cancelProcessing: function () {
    var oThis = this;
    if ( !oThis.isScheduled ) {
      logger.warn("EventProcessor :: cancelProcessing :: Processing is NOT scheduled.", this.getEventDescription() );
      return;
    }
    clearTimeout( oThis.timer );
    oThis.isScheduled = false;
    oThis.timer = -1;
  },

  processRequest: function () {
    const oThis = this
      ,returnValues = this.eventObj.returnValues
      ,uuid                 = returnValues._uuid
      ,staker               = returnValues._staker
      ,stakerNonce          = returnValues._stakerNonce
      ,amountST             = returnValues._amountST
      ,amountUT             = returnValues._amountUT
      ,escrowUnlockHeight   = returnValues._escrowUnlockHeight
      ,mintingIntentHash    = returnValues._mintingIntentHash
      ;
    if ( !oThis.isValid() ) {
      logger.warn("EventProcessor :: processRequest :: Intent is not valid.", oThis.getEventDescription() );
      return;
    }
    logger.info("EventProcessor :: processRequest :: Processing Started.", oThis.getEventDescription() );

    logger.step("Verifying stakingContract registrar");

    oThis.stakingContract.methods.adminAddress().call()
      .catch( function(error) {
        logger.error( error.message );
        logger.log( error );
        throw "stakingContract registrar verification failed";
      })
      .then(function(stakeAdmin) {
        stakeAdmin = stakeAdmin.toLowerCase();
        if ( stakeAdmin != registrarAddress ) {
          throw "stakingContract registrar verification failed";
        }
        logger.win("stakingContract registrar verification passed");
        return true;
      })
      .then(function(isAdminValid){
        logger.step("Fetching UtilityToken(ERC20) Address");
        return oThis.getStakerMember( staker );
      })
      .then(function(member){
        logger.win("received utilityTokenAddress", utilityTokenAddress);
        logger.step("Minting UtilityToken");
        var utilityTokenContractInteract = new utilityTokenContractInteractKlass(member);
        return utilityTokenContractInteract.mint(
          uuid,
          staker,
          stakerNonce,
          amountST,
          amountUT,
          escrowUnlockHeight,
          mintingIntentHash
        );
      })
      .then(function(mintEvent){
        logger.win("Minting Intent has been Confirmed for mintingIntentHash" , mintingIntentHash);
        oThis.triggerProcessCallback( true );
      })
      .catch( function(error){
        logger.error( error.message, oThis.getEventDescription());
        //Always mark request as complete.
        oThis.triggerProcessCallback( false );
      });
  },

  triggerProcessCallback: function ( success ) {
    var oThis = this;
    oThis.stakingContract = null;
    oThis.isScheduled = false;
    if(oThis.onProcessCallback){
      oThis.onProcessCallback( oThis.eventObj, success);
    }
    oThis.eventObj = null;
    oThis.onProcessCallback = null;
  },

  getEventDescription: function () {
    return "IntentHandler EventId: " + this.eventObj.id + " transactionHash: " + this.eventObj.transactionHash;
  },

  getStakerMember: function ( staker ) {
    return new Promise(function (resolve,reject) {
      const Config = require( rootPrefix + '/config.json');
      var selectedMember = null;
      Config.Members.some(function ( member ) {
        if ( member.Reserve.toLowerCase() == staker.toLowerCase() ) {
          selectedMember = member;
          return true;
        }
      });
      if (selectedMember) {
        logger.info("getStakerMember :: staker", staker, " found erc20", erc20 );
        resolve( selectedMember );
      } else {
        reject("ERC20 not found for staker address " , staker);
      }
    });
  }
};
