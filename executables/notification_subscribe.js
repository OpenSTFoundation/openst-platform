"use strict";

const openSTNotification = require('@openstfoundation/openst-notification');

openSTNotification.subscribe_event.rabbit(
  ['#'],
  function(msgContent){
    console.log('[RECEIVED]', msgContent, '\n')
  }
);
