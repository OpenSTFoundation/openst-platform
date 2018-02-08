"use strict";

const openSTNotification = require('@openstfoundation/openst-notification');


function subscribe(){
  openSTNotification.subscribe_event.rabbit(
    ['#'],
    function(msgContent){
      console.log('[RECEIVED]', msgContent, '\n')
    }
  );
}
subscribe();

openSTNotification.subscribe_event.local(['rmq_fail'], function(err){
  console.log('RMQ Failed event received.');
  setTimeout(subscribe, 2000);
});