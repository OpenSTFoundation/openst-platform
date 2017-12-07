"use strict";

/**
 * This script accepts the tasks from the intercomm process,
 * Put them into a queue and run the processor passed from intercomm with the delay of 6 blocks.
 *
 * @module lib/web3/events/queue_manager
 *
 */

const rootPrefix = '../../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , eventProcessorKlass = require(rootPrefix+'/lib/web3/events/processor');

const EventQueueManager = module.exports = function () {};

/**
 * Ivent Queue Manager for InterComm.
 * @namespace EventQueueManager
 */
EventQueueManager.prototype = {

  /**
   * Starts the process of the script with initializing processor
   * @constructor
   * @memberOf EventQueueManager
   */
  constructor: EventQueueManager,

  /**
   * Queue Handler initialization
   */
  handlerQueue: {},

  /**
   * Processor initialization
   */
  processor: null,

  /**
   * Setting Processor passed from caller like {@link module:services/inter_comm/stake_and_mint}
   *
   * @param {function} processor - Process to be executed on event catch.
   *
   */
  setProcessor: function (processor) {
    this.processor = processor;
  },

  /**
   * Add Edit object in the {@link handlerQueue}
   *
   * @param {Object} eventObj - Event object.
   *
   */
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

  /**
   * Verify and add object of {@link module:lib/web3/events/processor} in the {@link handlerQueue}
   *
   * @param {Object} eventObj - Event object.
   *
   */
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

  /**
   * - If the event is updated, cancel the processing using cancelProcessing method in {@link module:lib/web3/events/processor}.
   * <br> - Update the event data in object of processor
   * <br> - And schedule it for processing using scheduleProcessing method in {@link module:lib/web3/events/processor}.
   *
   * @param {Object} eventObj - Event object.
   *
   */
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

  /**
   * - If the event is removed, cancel the processing using cancelProcessing method in {@link module:lib/web3/events/processor}.
   * <br> - And dequeue the event from the queue by using {@link dequeueIntent}
   *
   * @param {Object} eventObj - Event object.
   *
   */
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

  /**
   * dequeue the event from the queue
   *
   * @param {Object} eventObj - Event object.
   *
   */
  dequeueIntent: function ( eventObj ) {
    var oThis = this;
    const eventId = eventObj.id;

    if ( !oThis.handlerQueue[ eventId ] ) {
      return;
    }

    oThis.handlerQueue[ eventId ] = null;

  }

};