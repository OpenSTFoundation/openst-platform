"use strict";

/**
 * Format decoded event into Hash with all the events received into it.
 *
 * @module lib/web3/events/formatter
 *
 */

const web3EventsFormatter = module.exports = function () {};

/**
 * Ivent Formatter.
 *
 * @namespace web3EventsFormatter
 *
 */
web3EventsFormatter.prototype = {

  /**
   * performer
   *
   * @param formattedTransactionReceipt
   * @returns {Promise.<{}>}
   *
   * @methodOf web3EventsFormatter
   *
   */
  perform: function(formattedTransactionReceipt) {
    var eventsData = formattedTransactionReceipt.eventsData
      , formattedEvents = {};

    for (var i = 0; i < eventsData.length; i++) {
      var currEvent = eventsData[i]
        , currEventName = currEvent.name
        , currEventAddr = currEvent.address
        , currEventParams = currEvent.events;

      formattedEvents[currEventName] = {address: currEventAddr};

      for (var j = 0; j < currEventParams.length; j++) {
        var p = currEventParams[j];
        formattedEvents[currEventName][p.name] = p.value;
      }

    }

    return Promise.resolve(formattedEvents);
  }

};

module.exports = new web3EventsFormatter();