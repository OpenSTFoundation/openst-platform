"use strict"

const rootPrefix = '../..'
  , logger = require(rootPrefix + "/helpers/CustomConsoleLogger")
  , eventProcessorKlass = require(rootPrefix+'/services/inter_comm/event_processor');

const EventQueueManager = module.exports = function (stakingContract) {
  this.stakingContract = stakingContract;
};

EventQueueManager.prototype = {

  constructor: EventQueueManager,

  handlerQueue: {},

  addEditEventInQueue: function ( eventObj ) {
    var oThis = this;
    const eventId = eventObj.id;

    if ( oThis.handlerQueue[ eventId ] ) {
      //We have received this event before. It may have been changed/removed.
      if ( eventObj.removed ) {
        //Lets remove it.
        oThis.removeIntent( eventObj );
      } else {
        //Lets update it.
        oThis.updateIntent( eventObj );
      }
    }
    else if ( eventObj.removed ) {
      //Lets ignore it. We had nothing to do with it anyway.
      return;
    } else {
      //This is a new event. Lets queue it.
      oThis.queueIntent( eventObj );
    }

    //This is new event or has changed. Lets queue it.
    //queueIntent.handlerQueue[ eventId ] = eventObj;
  },

  queueIntent: function ( eventObj ) {
    var oThis = this;

    const eventId = eventObj.id;

    logger.info("Queuing", eventId);

    //interComm.describeEvent(eventObj, "Staking");

    //Sanity Check
    if ( oThis.handlerQueue[eventId] ) {
      logger.error(eventId, " has already been queued");
      return;
    }

    //Create intent handler
    const _handler = new eventProcessorKlass( eventObj, oThis.stakingContract );

    //Set the onProcessCallback
    _handler.setOnProcessCallback(function ( eventObj, success ) {
      if ( eventId ) {
        logger.info(eventId, "has been processed successfully.");
      } else {
        logger.error(eventId, "has been processed successfully.");
      }
      oThis.dequeueIntent( eventObj )
    });

    //If its a valid event scheduleProcessing.
    if ( !_handler.isValid() ) {
      logger.warn("queueIntent :: Intent is not valid.", _handler.getEventDescription() );
      return;
    }
    _handler.scheduleProcessing();

    //Just for the sake of it.
    oThis.handlerQueue[ eventId ] = _handler;
  },

  updateIntent: function ( eventObj ) {
    var oThis = this;

    const eventId = eventObj.id;
    const _handler = oThis.handlerQueue[ eventId ];

    if ( !_handler ) {
      logger.info("updateIntent :: _handler is null");
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
    _handler.scheduleProcessing();

    //Just for the sake of it.
    oThis.handlerQueue[ eventId ] = _handler;
  },

  removeIntent: function ( eventObj ) {
    var oThis = this;

    const eventId = eventObj.id;
    const _handler = oThis.handlerQueue[ eventId ];

    logger.warn(eventId, "has been removed");
    //interComm.describeEvent(eventObj, "Staking");

    if ( !_handler ) {
      return;
    }

    //Cancel Scheduled Processing.
    _handler.cancelProcessing();

    //Dequeue it.
    oThis.dequeueIntent( eventObj );

  },

  dequeueIntent: function ( eventObj ) {
    var oThis = this;
    const eventId = eventObj.id;

    if ( !oThis.handlerQueue[ eventId ] ) {
      return;
    }

    oThis.handlerQueue[ eventId ] = null;

  }

}