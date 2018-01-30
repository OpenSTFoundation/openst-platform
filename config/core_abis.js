"use strict";

/*
 * Load all required contract abi files and export them
 *
 */

/**
 * Load all required contract abi files and export them.<br><br>
 *
 * @module config/core_abis
 */

const fs = require('fs')
  , path = require('path')
;

const rootPrefix = "..";

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || "utf8");
  return JSON.parse(fileContent);
}

/**
 * Constructor for openST core contract abis
 *
 * @constructor
 */
const coreAbis = function() {};

coreAbis.prototype = {
  /**
   * Value Chain Contract: simple token EIP20 contract ABI.<br><br>
   *
   * @return {ABI}
   */
  simpleToken: parseFile(rootPrefix + '/contracts/abi/SimpleToken.abi', "utf8"),

  /**
   * Value Chain Contract: mock simple token EIP20 contract ABI.<br><br>
   * <b>NOTE: Used to test protocol on MainNet and is destroyed, after testing.</b>
   *
   * @return {ABI}
   */
  mockSimpleToken: parseFile(rootPrefix + '/contracts/abi/MockToken.abi', "utf8"),

  /**
   * Utility Chain Contract: openst utility contract ABI.<br><br>
   * <b>Contract has details of all registered branded tokens, and has methods for stake and redeem</b>
   *
   * @return {ABI}
   */
  openSTUtility: parseFile(rootPrefix + '/contracts/abi/OpenSTUtility.abi', "utf8"),

  /**
   * Value Chain Contract: openst Value contract ABI.<br><br>
   * <b>Contract has details of all registered branded tokens, and has methods for stake and redeem</b>
   *
   * @return {ABI}
   */
  openSTValue: parseFile(rootPrefix + '/contracts/abi/OpenSTValue.abi', "utf8"),

  /**
   * Utility Chain Contract: ST' contract ABI.<br><br>
   * <b>Simple Token Prime [ST'] is equivalently staked with Simple Token on the value chain and
   * is the base token that pays for gas on the utility chain. It also facilitate stake and redeem
   * for ST'</b>
   *
   * @return {ABI}
   */
  stPrime: parseFile(rootPrefix + '/contracts/abi/STPrime.abi', "utf8"),
  valueCore: parseFile(rootPrefix + '/contracts/abi/Core.abi', "utf8"),
  valueRegistrar: parseFile(rootPrefix + '/contracts/abi/Registrar.abi', "utf8"),
  utilityRegistrar: parseFile(rootPrefix + '/contracts/abi/Registrar.abi', "utf8"),
  brandedToken: parseFile(rootPrefix + '/contracts/abi/BrandedToken.abi', "utf8"),
  simpleStake: parseFile(rootPrefix + '/contracts/abi/SimpleStake.abi', "utf8")
};

module.exports = new coreAbis();
