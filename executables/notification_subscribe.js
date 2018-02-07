"use strict";

const notificationSubscribe = require('/Users/Alpesh/Documents/simpletoken/openst-notification/index.js');

notificationSubscribe.subscribe_event.rabbit(
  ["events.transfer"],
  function(msgContent){
    console.log('---My---msgContent---', msgContent)
  }
);
