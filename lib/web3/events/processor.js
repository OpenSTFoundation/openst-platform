"use strict";

const rootPrefix = '../../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  ;

const EventProcessor = module.exports = function (eventObj, processor) {
  this.setEventData( eventObj );

  //IMPORTANT:: processor should always return a promise.
  this.processor = processor;
};

EventProcessor.prototype = {

  constructor: EventProcessor,

  setEventData: function(eventObj){
    this.eventObj = eventObj;
  },

  processor: null,

  // we will process the event after 90 seconds. This corresponds to 6 blocks safe delay.
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
    if ( oThis.isScheduled || !oThis.isValid()) {
      logger.warn("EventProcessor :: scheduleProcessing :: Processing is already scheduled or not valid.", oThis.getEventDescription() );
      return false;
    }
    oThis.isScheduled = true;
    oThis.timer = setTimeout(function () {

      logger.info("EventProcessor :: processRequest :: Processing Started.", oThis.getEventDescription() );

      oThis.processor(oThis.eventObj)
        .then(function(res){
          console.log('success', JSON.stringify(res));
          oThis.triggerProcessCallback( true );
        })
        .catch( function(error){
          console.log('error', JSON.stringify(error));
          oThis.triggerProcessCallback( false );
        });
    }, oThis.eventProcessingDelay);

    return true;
  },

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

  triggerProcessCallback: function ( success ) {
    var oThis = this;
    oThis.isScheduled = false;
    if(oThis.onProcessCallback){
      oThis.onProcessCallback( oThis.eventObj, success);
    }
    oThis.eventObj = null;
    oThis.onProcessCallback = null;
  },

  getEventDescription: function () {
    return "IntentHandler EventId: " + this.eventObj.id + " transactionHash: " + this.eventObj.transactionHash;
  }

};
