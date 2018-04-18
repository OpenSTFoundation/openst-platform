"use strict";

/**
 * Executable to listen rabbitmq events.
 */

const openSTNotification = require('@openstfoundation/openst-notification');

const rootPrefix = '..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger');

/**
 * Subscribe to all events of rabbit.
 */
function subscribe() {
  openSTNotification.subscribeEvent.rabbit(
    ['#'],
    {queue: 'openst_platform'},
    function (msgContent) {
      logger.debug('[RECEIVED]', msgContent, '\n');
    }
  ).catch(function (err) {
    logger.error(err);
  });
}

// Start
logger.step("* Started the OpenST Notifications");
subscribe();