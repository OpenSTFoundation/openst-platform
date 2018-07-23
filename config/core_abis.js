"use strict";

/**
 * Load all required contract abi files and export them.<br><br>
 *
 * @module config/core_abis
 */

const fs = require('fs')
  , path = require('path')
;

const rootPrefix = ".."
;

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
const coreAbis = function () {
};

coreAbis.prototype = {
  /**
   * Value Chain Contract: simple token EIP20 contract ABI.<br><br>
   *
   * @constant {object}
   *
   */
  simpleToken: parseFile(rootPrefix + '/contracts/abi/SimpleToken.abi', "utf8"),
  
  /**
   * Value Chain Contract: mock simple token EIP20 contract ABI.<br><br>
   * <b>NOTE: This contract is used to test protocol on MainNet and is destroyed, after testing.</b>
   *
   * @constant {object}
   *
   */
  mockSimpleToken: parseFile(rootPrefix + '/contracts/abi/MockToken.abi', "utf8"),
  
  /**
   * Utility Chain Contract: openst utility contract ABI.<br><br>
   * <b>This contract has details of all registered branded tokens, and has methods for stake and redeem</b>
   *
   * @constant {object}
   *
   */
  openSTUtility: parseFile(rootPrefix + '/contracts/abi/OpenSTUtility.abi', "utf8"),
  
  /**
   * Value Chain Contract: openst Value contract ABI.<br><br>
   * <b>This contract has details of all registered branded tokens, and has methods for stake and redeem</b>
   *
   * @constant {object}
   *
   */
  openSTValue: parseFile(rootPrefix + '/contracts/abi/OpenSTValue.abi', "utf8"),
  
  /**
   * Utility Chain Contract: ST' contract ABI.<br><br>
   * <b>Simple Token Prime [ST'] is equivalently staked with Simple Token on the value chain and
   * is the base token that pays for gas on the utility chain. It also facilitate stake and redeem
   * for ST'</b>
   *
   * @constant {object}
   *
   */
  stPrime: parseFile(rootPrefix + '/contracts/abi/STPrime.abi', "utf8"),
  
  /**
   * Value Chain Contract: Value core contract ABI.<br><br>
   * <b>For each utility chain, one value core contract is deployed and
   * it holds the information regarding the utility chain.</b>
   *
   * @constant {object}
   *
   */
  valueCore: parseFile(rootPrefix + '/contracts/abi/Core.abi', "utf8"),
  
  /**
   * Value Chain Contract: Value registrar contract ABI.<br><br>
   * <b>This contract maintains the registry information of the utility token. It acts as a mediator for staking and redeeming.</b>
   *
   * @constant {object}
   *
   */
  valueRegistrar: parseFile(rootPrefix + '/contracts/abi/Registrar.abi', "utf8"),
  
  /**
   * Utility Chain Contract: Utility registrar contract ABI.<br><br>
   * <b>This contract maintains the registry information of the utility token. It acts as a mediator for staking and redeeming.</b>
   *
   * @constant {object}
   *
   */
  utilityRegistrar: parseFile(rootPrefix + '/contracts/abi/Registrar.abi', "utf8"),
  
  /**
   * Utility Chain Contract: Branded token EIP20 contract ABI.<br><br>
   *
   * @constant {object}
   *
   */
  brandedToken: parseFile(rootPrefix + '/contracts/abi/BrandedToken.abi', "utf8"),
  
  /**
   * Value Chain Contract: Simple stake contract ABI.<br><br>
   * <b>It holds the staked simple tokens for minted branded tokens.</b>
   *
   * @constant {object}
   *
   */
  simpleStake: parseFile(rootPrefix + '/contracts/abi/SimpleStake.abi', "utf8"),
  
  /**
   * Utility Chain Contract: Airdrop contract ABI.<br><br>
   * <b>Contract for managing airdrops.</b>
   *
   * @constant {object}
   *
   */
  airdrop: parseFile(rootPrefix + '/contracts/abi/Airdrop.abi', "utf8")
};

module.exports = new coreAbis();
