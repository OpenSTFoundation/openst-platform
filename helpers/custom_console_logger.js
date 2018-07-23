"use strict";

/**
 * Custom console logger
 *
 * @module helpers/custom_console_logger
 */

const getNamespace = require('continuation-local-storage').getNamespace
  // Get common local storage namespace to read
  // request identifiers for debugging and logging
  , openSTNotification = require('@openstfoundation/openst-notification')
  , OSTBase = require('@openstfoundation/openst-base')
  , requestNamespace = getNamespace('openST-Platform-NameSpace')
;

const rootPrefix = ".."
  , packageFile = require(rootPrefix + '/package.json')
;

const Logger = OSTBase.Logger
  , loggerLevel = (process.env.OST_DEBUG_ENABLED == '1' ? Logger.LOG_LEVELS.TRACE : Logger.LOG_LEVELS.INFO)
  , packageName = packageFile.name
;

/**
 * Method to convert Process hrTime to Milliseconds
 *
 * @param {number} hrTime - this is the time in hours
 *
 * @return {number} - returns time in milli seconds
 */
const timeInMilli = function (hrTime) {
  return (hrTime[0] * 1000 + hrTime[1] / 1000000);
};

/**
 * Method to append Request in each log line.
 *
 * @param {string} message
 */
const appendRequest = function (message) {
  var newMessage = "";
  if (requestNamespace) {
    if (requestNamespace.get('reqId')) {
      newMessage += "[" + requestNamespace.get('reqId') + "]";
    }
    if (requestNamespace.get('workerId')) {
      newMessage += "[Worker - " + requestNamespace.get('workerId') + "]";
    }
    const hrTime = process.hrtime();
    newMessage += "[" + timeInMilli(hrTime) + "]";
  }
  newMessage += message;
  return newMessage;
};


Logger.prototype.notify = function (code, msg, data, backtrace) {
  var args = [appendRequest(this.NOTE_PRE)];
  args = args.concat(Array.prototype.slice.call(arguments));
  args.push(this.CONSOLE_RESET);
  console.log.apply(console, args);
  
  var bodyData = null
  ;
  
  try {
    bodyData = JSON.stringify(data);
  } catch (err) {
    bodyData = data;
  }
  
  openSTNotification.publishEvent.perform(
    {
      topics: ["email_error." + packageName],
      publisher: 'OST',
      message: {
        kind: "email",
        payload: {
          subject: packageName + " ::" + code,
          body: " Message: " + msg + " \n\n Data: " + bodyData + " \n\n backtrace: " + backtrace
        }
      }
    });
};

module.exports = new Logger("openst-platform", loggerLevel);
