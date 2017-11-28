"use strict";

const web3EventsFormatter = module.exports = function () {};

web3EventsFormatter.prototype = {
  perform: function(formattedTransactionReceipt) {
    var eventsData = formattedTransactionReceipt.eventsData
      , formattedEvents = {};

    var eventDataValues = {};

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