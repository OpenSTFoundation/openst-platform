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
const coreBins = function () {
};

coreBins.prototype = {
  /**
   * Simple token contract binary
   *
   * @constant {binary}
   *
   */
  simpleToken: readFile(rootPrefix + '/contracts/bin/SimpleToken.bin', 'utf8'),
  
  /**
   * Mock Simple token contract binary
   *
   * @constant {binary}
   *
   */
  mockSimpleToken: readFile(rootPrefix + '/contracts/bin/MockToken.bin', 'utf8'),
  
  /**
   * Open ST Utility contract binary
   *
   * @constant {binary}
   *
   */
  openSTUtility: readFile(rootPrefix + '/contracts/bin/OpenSTUtility.bin', 'utf8'),
  
  /**
   * Open ST Value contract binary
   *
   * @constant {binary}
   *
   */
  openSTValue: readFile(rootPrefix + '/contracts/bin/OpenSTValue.bin', 'utf8'),
  
  /**
   * ST Prime contract binary
   *
   * @constant {binary}
   *
   */
  stPrime: readFile(rootPrefix + '/contracts/bin/STPrime.bin', 'utf8'),
  
  /**
   * Value Core contract binary
   *
   * @constant {binary}
   *
   */
  valueCore: readFile(rootPrefix + '/contracts/bin/Core.bin', 'utf8'),
  
  /**
   * Value Registrar contract binary
   *
   * @constant {binary}
   *
   */
  valueRegistrar: readFile(rootPrefix + '/contracts/bin/Registrar.bin', 'utf8'),
  
  /**
   * Utility Registrar contract binary
   *
   * @constant {binary}
   *
   */
  utilityRegistrar: readFile(rootPrefix + '/contracts/bin/Registrar.bin', 'utf8'),
  
  /**
   * Branded Token contract binary
   *
   * @constant {binary}
   *
   */
  brandedToken: readFile(rootPrefix + '/contracts/bin/BrandedToken.bin', 'utf8'),
  
  /**
   * Simple Stake contract binary
   *
   * @constant {binary}
   *
   */
  simpleStake: readFile(rootPrefix + '/contracts/bin/SimpleStake.bin', 'utf8'),
  
  /**
   * Airdrop contract binary
   *
   * @constant {binary}
   *
   */
  airdrop: readFile(rootPrefix + '/contracts/bin/Airdrop.bin', 'utf8')
};

module.exports = new coreBins();
