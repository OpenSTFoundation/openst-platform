"use strict";

const rootPrefix = '../../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , eventProcessorKlass = require(rootPrefix+'/lib/web3/events/processor');

const EventQueueManager = module.exports = function () {};

EventQueueManager.prototype = {

  constructor: EventQueueManager,

  handlerQueue: {},

  processor: null,

  setProcessor: function (processor) {
    this.processor = processor;
  },

  addEditEventInQueue: function ( eventObj ) {
    var oThis = this;
    const eventId = eventObj.id;

    if ( oThis.handlerQueue[ eventId ] ) {
      //We have received this event before. It may have been changed/removed.
      if ( eventObj.removed ) {
        oThis.removeIntent( eventObj );
      } else {
        oThis.updateIntent( eventObj );
      }
    }
    else if ( eventObj.removed ) {
      return false;
    } else {
      //This is a new event. Lets queue it.
      oThis.queueIntent( eventObj );
    }

  },

  queueIntent: function ( eventObj ) {
    var oThis = this;

    const eventId = eventObj.id;

    logger.info("Queuing", eventId);

    //Sanity Check
    if ( oThis.handlerQueue[eventId] ) {
      logger.error(eventId, " has already been queued");
      return;
    }

    //Create intent handler
    const _handler = new eventProcessorKlass( eventObj, oThis.processor );

    //Set the onProcessCallback
    _handler.setOnProcessCallback(function ( eventObj, success ) {
      if ( eventId ) {
        logger.info(eventId, "has been processed successfully.");
      } else {
        logger.error(eventId, "has been processed successfully.");
      }
      oThis.dequeueIntent( eventObj )
    });

    var isScheduled = _handler.scheduleProcessing();

    if(!isScheduled){return;}

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

    var isScheduled = _handler.scheduleProcessing();

    if(!isScheduled){return;}

    //Just for the sake of it.
    oThis.handlerQueue[ eventId ] = _handler;
  },

  removeIntent: function ( eventObj ) {
    var oThis = this;

    const eventId = eventObj.id;
    const _handler = oThis.handlerQueue[ eventId ];

    logger.warn(eventId, "has been removed");

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

};