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

var getNamespace = require('continuation-local-storage').getNamespace;

var appendRequest = function(message) {
    var myRequest = getNamespace('my request');
    var newMessage = "";
    if(myRequest){
      if(myRequest.get('reqId')){
        newMessage += ("[" + myRequest.get('reqId') + "]");
      }
      if(myRequest.get('workerId')){
        newMessage += ("[Worker - " + myRequest.get('workerId') + "]");
      }
      var hrTime = process.hrtime();
      newMessage += ("[" + (hrTime[0] * 1000000 + hrTime[1] / 1000) + "]");
    }
    newMessage += message;
    // message = myRequest && myRequest.get('reqId') ? message + " reqId: " + myRequest.get('reqId') : message;
    return newMessage;
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
};