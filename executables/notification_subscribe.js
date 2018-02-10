"use strict";

const openSTNotification = require('@openstfoundation/openst-notification');

const rootPrefix = '..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger');


function subscribe(){
  openSTNotification.subscribeEvent.rabbit(
    ['#'],
    function(msgContent){
      logger.info('[RECEIVED]', msgContent, '\n');
    }
  ).catch(function (err) {logger.error(err);});
}

// Start
logger.step("* Started the OpenST Notifications");
subscribe();