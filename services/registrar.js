"use strict";

/*
 * Constants file
 *
 * * Author: Rachin
 * * Date: 16/10/2017
 * * Reviewed by: 
 */


const Web3 = require("web3")
      ,reqPrefix = ".."
      ,logger = require(reqPrefix + "/helpers/CustomConsoleLogger")
      ,coreConstants = require(reqPrefix + '/config/core_constants')
      ,MintingIntentHandler = require(reqPrefix + "/services/mintingIntentHandler")
;


const valueChain = new Web3( coreConstants.OST_GETH_VALUE_CHAIN_WS_PROVIDER );

const simpleTokenContract = (function () {
  const ContractJson = require( reqPrefix + "/contracts/SimpleToken.json")
        ,contractAddress = coreConstants.OST_SIMPLETOKEN_CONTRACT_ADDRESS
        ,contractAbi = JSON.parse( ContractJson.contracts["SimpleToken.sol:SimpleToken"].abi )
        ,contract = new valueChain.eth.Contract( contractAbi, contractAddress )
  ;
  return contract;
})();

const stakingContract = (function () {
  const ContractJson = require( reqPrefix + "/contracts/Staking.json")
        ,contractAddress = coreConstants.OST_STAKE_CONTRACT_ADDRESS
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,contract = new valueChain.eth.Contract( contractAbi, contractAddress )
  ;
  return contract;
})();





const registrar = module.exports = {
  _secret: coreConstants.OST_REGISTRAR_SECRET_KEY
  ,valueChain: valueChain
  ,eventProcessingDelay: 100
  ,init: function () {
    this.bindSTEvents();
    this.bindStakeEvents();
  }
  //Generic Method to log event subscription error
  ,onEventSubscriptionError: function ( error ) {
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  }
  //Generic Method to log any event.
  ,describeEvent: function ( eventObj, contractName ) {
    const eventId = eventObj.id
          ,name = eventObj.event
          ,address = eventObj.address
          ,transactionHash = eventObj.transactionHash
    ;
    logger.log(
      "----------- Describing" , eventId
      ,"\n Contract:", contractName
      ,"\n Event:" , name
      ,"\n transactionHash: ", transactionHash
      ,"\n address:", address
      ,"\n\n", JSON.stringify( eventObj )
      ,"\n\n----------- Description Ends."
    );

  }

  ,simpleTokenContract: simpleTokenContract
  ,bindSTEvents: function () {
    if ( !registrar.simpleTokenContract.events.Approval ) {
      logger.error("Approval event missing in SimpleToken Contract");
    } else {
      logger.log("bindSTEvents binding Approval");
      registrar.simpleTokenContract.events.Approval({})
        .on('error', (errorObj =>{
          logger.win("error :: Approval");
          registrar.onEventSubscriptionError( errorObj );
        }))
        .on('data', (eventObj => {
          logger.win("data :: Approval");
          registrar.onSimpleTokenApprovalReceived( eventObj );
        }))
        .on('changed', (eventObj => {
          logger.win("changed :: Approval");
          registrar.onSimpleTokenApprovalReceived( eventObj );
        }))
    }
    logger.log("bindSTEvents done");
  }
  ,onSimpleTokenApprovalReceived: function ( eventObj ) {
    this.describeEvent( eventObj , "SimpleToken");
  }


  ,stakingContract: stakingContract
  ,bindStakeEvents: function () {
    if ( !registrar.stakingContract.events.MintingIntentDeclared ) {
      logger.error("MintingIntentDeclared event missing in Staking Contract");
    } else {
      logger.log("bindStakeEvents binding MintingIntentDeclared");
      registrar.stakingContract.events.MintingIntentDeclared({})
        .on('error', (errorObj =>{
          logger.win("error :: MintingIntentDeclared");
          registrar.onEventSubscriptionError( errorObj );
        }))
        .on('data', (eventObj => {
          logger.win("data :: MintingIntentDeclared");
          registrar.onMintingIntentDeclared( eventObj );
        }))
        .on('changed', (eventObj => {
          logger.win("changed :: MintingIntentDeclared");
          registrar.onMintingIntentDeclared( eventObj );
        }))
    }
    logger.log("bindStakeEvents done");
  }

  ,handlerQueue: {}
  ,onMintingIntentDeclared: function ( eventObj ) {
    const eventId = eventObj.id;

    if ( registrar.handlerQueue[ eventId ] ) {
      //We have received this event before. It may have been changed/removed.
      if ( eventObj.removed ) {
        //Lets remove it.
        registrar.removeIntent( eventObj );
      } else {
        //Lets update it.
        registrar.updateIntent( eventObj );
      }
    }
    else if ( eventObj.removed ) {
      //Lets ignore it. We had nothing to do with it anyway.
      return;
    } else {
      //This is a new event. Lets queue it.
      registrar.queueIntent( eventObj );
    }

    //This is new event or has changed. Lets queue it.
    registrar.handlerQueue[ eventId ] = eventObj;
  }

  ,queueIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;

    logger.info("Queuing", eventId);
    registrar.describeEvent(eventObj, "Staking");

    //Sanity Check
    if ( handlerQueue[ eventId ] ) {
      logger.error(eventId, " has already been queued");
      return;
    }

    //Create intent handler
    const _handler = new MintingIntentHandler( eventObj, stakingContract );

    //Set the onProcessCallback
    _handler.setOnProcessCallback(function ( eventObj, success ) {
      if ( eventId ) {
        logger.info(eventId, "has been processed successfully.");
      } else {
        logger.error(eventId, "has been processed successfully.");
      }
      registrar.dequeueIntent( eventObj )
    });

    //If its a valid event scheduleProcessing.
    if ( !_handler.isValid() ) {
      logger.warn("queueIntent :: Intent is not valid.", _handler.getEventDescription() );
      return;
    }
    _handler.scheduleProcessing( registrar.eventProcessingDelay );

    //Just for the sake of it.
    handlerQueue[ eventId ] = _handler;
  }
  ,updateIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;
    const _handler = handlerQueue[ eventId ];

    if ( !_handler ) {
      return;
    }

    //Cancel Scheduled Processing.
    _handler.cancelProcessing();

    //Update Event Data.
    _handler.setEventData( eventObj );

    //If its a valid event scheduleProcessing.
    if ( !_handler.isValid() ) {
      logger.warn("updateIntent :: Intent is not valid.", _handler.getEventDescription() );
      return;
    }
    _handler.scheduleProcessing( registrar.eventProcessingDelay );

    //Just for the sake of it.
    handlerQueue[ eventId ] = _handler;
  }
  ,removeIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;
    const _handler = handlerQueue[ eventId ];

    logger.warn(eventId, "has been removed");
    registrar.describeEvent(eventObj, "Staking");

    if ( !_handler ) {
      return;
    }

    //Cancel Scheduled Processing.
    _handler.cancelProcessing();

    //Dequeue it.
    registrar.dequeueIntent( eventObj );


  }
  ,dequeueIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;
    const _handler = handlerQueue[ eventId ];

    if ( !_handler ) {
      return;
    }

    handlerQueue[ eventId ] = null;

    //Just for the sake of it.
    if ( _handler.isScheduled ) {
      _handler.cancelProcessing();  
    }
    
  }
};





registrar.init();
logger.win("registrar initiated");

