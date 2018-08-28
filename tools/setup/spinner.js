'use strict';
/**
 * Run spinner while waiting
 *
 * @module tools/setup/spinner
 */
const Spinner = require('cli-spinner').Spinner,
  spinner = new Spinner('%s');

// Set spinner
spinner.setSpinnerString('|/-\\\\');

/**
 * Constructor for spinner
 *
 * @constructor
 */
const SpinnerKlass = function() {};

SpinnerKlass.prototype = {
  /**
   * Start spinner
   */
  start: function() {
    spinner.start();
  },

  /**
   * Stop spinner
   */
  stop: function() {
    spinner.stop(true);
  }
};

module.exports = new SpinnerKlass();
