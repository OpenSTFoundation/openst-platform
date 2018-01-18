"use strict";

/*
 * Custom Console log methods. Apply different colors for different log levels/severity.
 *
 */
//
// const CONSOLE_RESET = "\x1b[0m";
// const ERR_PRE = "\x1b[31m"; //Error. (RED)
// const INFO_PRE = "\x1b[33m  "; //Info (YELLOW)
// const WIN_PRE = "\x1b[32m"; //Success (GREEN)
// const WARN_PRE = "\x1b[43m";
// const STEP_PRE = "\n\x1b[34m"; //Step Description (BLUE)


const CONSOLE_RESET = "";
const ERR_PRE = "";
const INFO_PRE = "";
const WIN_PRE = "";
const WARN_PRE = "";
const STEP_PRE = "";

// Get common local storage namespace to read
// request identifiers for debugging and logging
var getNamespace = require('continuation-local-storage').getNamespace
  , requestNamespace = getNamespace('inputRequest')
;

// Method to append Request in each log line.
var appendRequest = function(message) {
    var newMessage = "";
    if (requestNamespace) {
      if (requestNamespace.get('reqId')) {
        newMessage += "[" + requestNamespace.get('reqId') + "]";
      }
      if (requestNamespace.get('workerId')) {
        newMessage += "[Worker - " + requestNamespace.get('workerId') + "]";
      }
      var hrTime = process.hrtime();
      newMessage += "[" + timeInMilli(hrTime) + "]";
    }
    newMessage += message;
    return newMessage;
};

// Method to convert Process hrTime to Milliseconds
var timeInMilli = function(hrTime) {
  return (hrTime[0] * 1000 + hrTime[1] / 1000000);
};

// Find out the difference between request start time and complete time
var calculateRequestTime = function() {
  var reqTime = 0;
  if (requestNamespace && requestNamespace.get('startTime')) {
    var hrTime = process.hrtime();
    reqTime = timeInMilli(hrTime) - timeInMilli(requestNamespace.get('startTime'));
  }
  return reqTime;
};

module.exports = {
  "STEP_PRE": STEP_PRE
  , "WARN_PRE": WARN_PRE
  , "WIN_PRE": WIN_PRE
  , "INFO_PRE": INFO_PRE
  , "ERR_PRE": ERR_PRE
  , "CONSOLE_RESET": CONSOLE_RESET

  , step: function () {
    var args = [appendRequest(this.STEP_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  //Method to Log Information
  , info: function () {
    var args = [appendRequest(this.INFO_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  //Method to Log Error.
  , error: function () {
    var args = [appendRequest(this.ERR_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  , warn: function () {
    var args = [appendRequest(this.WARN_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  //Method to Log Success/Win.
  , win: function () {
    var args = [appendRequest(this.WIN_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  , log: function () {
    console.log.apply(console, arguments);
  }

  //Method to Log Request Started.
  , requestStartLog: function (requestUrl) {
    var d = new Date();
    var dateTime = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"."+d.getMilliseconds();
    var message = ("Started '" + requestUrl + "' at " + dateTime);
    this.info(message);
  }

  //Method to Log Request Completed.
  , requestCompleteLog: function (status) {
    var message = ("Completed '" + status + "' in " + calculateRequestTime() + "ms");
    this.info(message);
  }
};