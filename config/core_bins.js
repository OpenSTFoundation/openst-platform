"use strict";

/**
 * Load all required contract abi files and export them.<br><br>
 *
 * @module config/core_bins
 */

const fs = require('fs')
  , path = require('path')
;

const rootPrefix = "..";

function readFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  return fs.readFileSync(filePath, options || "utf8");
}

/**
 * Constructor for openST core contract bins
 *
 * @constructor
 */
const coreBins = function() {};

coreBins.prototype = {
  /**
   * Simple token contract Binary
   *
   * @return {binary}
   */
  simpleToken: readFile(rootPrefix + '/contracts/bin/SimpleToken.bin', 'utf8'),

  /**
   * Mock Simple token contract Binary
   *
   * @return {binary}
   */
  mockSimpleToken: readFile(rootPrefix + '/contracts/bin/MockToken.bin', 'utf8'),

  /**
   * Open ST Utility contract Binary
   *
   * @return {binary}
   */
  openSTUtility: readFile(rootPrefix + '/contracts/bin/OpenSTUtility.bin', 'utf8'),

  /**
   * Open ST Value contract Binary
   *
   * @return {binary}
   */
  openSTValue: readFile(rootPrefix + '/contracts/bin/OpenSTValue.bin', 'utf8'),

  /**
   * ST Prime contract Binary
   *
   * @return {binary}
   */
  stPrime: readFile(rootPrefix + '/contracts/bin/STPrime.bin', 'utf8'),

  /**
   * Value Core contract Binary
   *
   * @return {binary}
   */
  valueCore: readFile(rootPrefix + '/contracts/bin/Core.bin', 'utf8'),

  /**
   * Value Registrar contract Binary
   *
   * @return {binary}
   */
  valueRegistrar: readFile(rootPrefix + '/contracts/bin/Registrar.bin', 'utf8'),

  /**
   * Utility Registrar contract Binary
   *
   * @return {binary}
   */
  utilityRegistrar: readFile(rootPrefix + '/contracts/bin/Registrar.bin', 'utf8'),

  /**
   * Branded Token contract Binary
   *
   * @return {binary}
   */
  brandedToken: readFile(rootPrefix + '/contracts/bin/BrandedToken.bin', 'utf8'),

  /**
   * Simple Stake contract Binary
   *
   * @return {binary}
   */
  simpleStake: readFile(rootPrefix + '/contracts/bin/SimpleStake.bin', 'utf8')
};

module.exports = new coreBins();
