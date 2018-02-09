"use strict";

const openSTNotification = require('@openstfoundation/openst-notification');


function subscribe(){
  openSTNotification.subscribeEvent.rabbit(
    ['#'],
    function(msgContent){
      console.log('[RECEIVED]', msgContent, '\n')
    }
  );
}
subscribe();

openSTNotification.subscribeEvent.local(['rmq_fail'], function(err){
  console.log('RMQ Failed event received.');
  setTimeout(subscribe, 2000);
});