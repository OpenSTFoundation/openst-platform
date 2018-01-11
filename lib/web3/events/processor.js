"use strict";

/**
 * This script reads the queue set in {@link module:lib/web3/events/queue_manager}
 * <br> It schedules the task at given interval and dequeue.
 *
 * @module lib/web3/events/processor
 *
 */

const rootPrefix = '../../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  ;

const EventProcessor = module.exports = function (eventObj, processor) {
  this.setEventData( eventObj );

  //IMPORTANT:: processor should always return a promise.
  this.processor = processor;
};

/**
 * Ivent Processor.
 * @namespace EventProcessor
 */
EventProcessor.prototype = {

  /**
   * @constructor
   */
  constructor: EventProcessor,

  setEventData: function(eventObj){
    this.eventObj = eventObj;
  },

  /**
   * processor initialize
   */
  processor: null,

  /**
   * we should process the event after 90 seconds. This corresponds to 6 blocks safe delay.
   */
  eventProcessingDelay: 90000,

  /**
   * timer initialize
   */
  timer: -1,

  /**
   * isScheduled initialize to false
   */
  isScheduled: false,

  /**
   * eventObj initialize
   */
  eventObj: null,

  /**
   * onProcessCallback initialize
   */
  onProcessCallback: null,

  /**
   * Setting callback function on process the task {@link member:onProcessCallback}
   *
   * @param {function} callback
   */
  setOnProcessCallback: function ( callback ) {
    this.onProcessCallback = callback;
  },

  /**
   * Check if the eventObj is valid.
   *
   * @return {boolean}
   *
   */
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

  /**
   * Schedule Processing from the queue.
   *
   * @return {boolean}
   *
   */
  scheduleProcessing: function() {
    var oThis = this;
    if ( oThis.isScheduled || !oThis.isValid()) {
      logger.warn("EventProcessor :: scheduleProcessing :: Processing is already scheduled or not valid.", oThis.getEventDescription() );
      return false;
    }
    oThis.isScheduled = true;
    oThis.timer = setTimeout(function () {

      logger.info("EventProcessor :: processRequest :: Processing Started.", oThis.getEventDescription() );

      oThis.processor(oThis.eventObj)
        .then(function(res){
          logger.info('success', JSON.stringify(res));
          oThis.triggerProcessCallback( true );
        })
        .catch( function(error){
          logger.error('error', JSON.stringify(error));
          oThis.triggerProcessCallback( false );
        });
    }, oThis.eventProcessingDelay);

    return true;
  },

  /**
   * Cancel Processing.
   *
   */
  cancelProcessing: function () {
    var oThis = this;
    if ( !oThis.isScheduled ) {
      logger.warn("EventProcessor :: cancelProcessing :: Processing is NOT scheduled.", oThis.getEventDescription() );
      return;
    }
    clearTimeout( oThis.timer );
    oThis.isScheduled = false;
    oThis.timer = -1;
  },

  /**
   * Processor callback called in {@link scheduleProcessing}
   *
   */
  triggerProcessCallback: function ( success ) {
    var oThis = this;
    oThis.isScheduled = false;
    if(oThis.onProcessCallback){
      oThis.onProcessCallback( oThis.eventObj, success);
    }
    oThis.eventObj = null;
    oThis.onProcessCallback = null;
  },

  /**
   * Get Event Description.
   */
  getEventDescription: function () {
    return "IntentHandler EventId: " + this.eventObj.id + " transactionHash: " + this.eventObj.transactionHash;
  }

};
