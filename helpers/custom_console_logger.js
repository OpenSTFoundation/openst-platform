"use strict";

/**
 * Custom console logger
 *
 * @module helpers/custom_console_logger
 */

const getNamespace = require('continuation-local-storage').getNamespace
;

const CONSOLE_RESET = "\x1b[0m"
  , ERR_PRE = "\x1b[31m" //Error. (RED)
  , INFO_PRE = "\x1b[33m  " //Info (YELLOW)
  , WIN_PRE = "\x1b[32m" //Success (GREEN)
  , WARN_PRE = "\x1b[43m"
  , STEP_PRE = "\n\x1b[34m"
;

// Get common local storage namespace to read
// request identifiers for debugging and logging
const requestNamespace = getNamespace('openST-Platform-NameSpace')
;

/**
 * Method to append Request in each log line.
 *
 * @param {string} message
 */
const appendRequest = function(message) {
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

/**
 * Method to convert Process hrTime to Milliseconds
 *
 * @param {number} hrTime - this is the time in hours
 *
 * @return {number} - returns time in milli seconds
 */
const timeInMilli = function(hrTime) {
  return (hrTime[0] * 1000 + hrTime[1] / 1000000);
};

/**
 * Find out the difference between request start time and complete time
 */
const calculateRequestTime = function() {
  var reqTime = 0;
  if (requestNamespace && requestNamespace.get('startTime')) {
    const hrTime = process.hrtime();
    reqTime = timeInMilli(hrTime) - timeInMilli(requestNamespace.get('startTime'));
  }
  return reqTime;
};

/**
 * Custom COnsole Logger
 *
 * @constructor
 */
const CustomConsoleLoggerKlass = function() {};

CustomConsoleLoggerKlass.prototype = {
  /**
   * @ignore
   *
   * @constant {string}
   */
  STEP_PRE: STEP_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  WARN_PRE: WARN_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  WIN_PRE: WIN_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  INFO_PRE: INFO_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  ERR_PRE: ERR_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  CONSOLE_RESET: CONSOLE_RESET,

  /**
   * Log step
   */
  step: function () {
    var args = [appendRequest(this.STEP_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log info
   */
  info: function () {
    var args = [appendRequest(this.INFO_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log error
   */
  error: function () {
    var args = [appendRequest(this.ERR_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log warn
   */
  warn: function () {
    var args = [appendRequest(this.WARN_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log win - on done
   */
  win: function () {
    var args = [appendRequest(this.WIN_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log normal level
   */
  log: function () {
    console.log.apply(console, arguments);
  },

  //Method to Log Request Started.
  requestStartLog: function (requestUrl) {
    const oThis = this
      , d = new Date()
      , dateTime = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + " " + d.getHours() + ":" +
                    d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds()
      , message = 'Started \'' + requestUrl + '\' at ' + dateTime
    ;

    oThis.info(message);
  },

  //Method to Log Request Completed.
  requestCompleteLog: function (status) {
    const oThis = this
      , message = 'Completed \'' + status + '\' in ' + calculateRequestTime() + 'ms'
    ;

    oThis.info(message);
  }

};

module.exports = new CustomConsoleLoggerKlass();
