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


module.exports = {
  "STEP_PRE": STEP_PRE
  , "WARN_PRE": WARN_PRE
  , "WIN_PRE": WIN_PRE
  , "INFO_PRE": INFO_PRE
  , "ERR_PRE": ERR_PRE
  , "CONSOLE_RESET": CONSOLE_RESET

  , step: function () {
    var args = [this.STEP_PRE];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  //Method to Log Information
  , info: function () {
    var args = [this.INFO_PRE];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  //Method to Log Error.
  , error: function () {
    var args = [this.ERR_PRE];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  , warn: function () {
    var args = [this.WARN_PRE];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  //Method to Log Success/Win.
  , win: function () {
    var args = [this.WIN_PRE];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  , log: function () {
    console.log.apply(console, arguments);
  }
};