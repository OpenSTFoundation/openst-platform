"use strict";

/*
 * Load all contract abi files
 *
 */

const fs = require('fs')
  , path = require('path')
;

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || "utf8");
  return JSON.parse(fileContent);
}

const rootPrefix = "..";

const coreAbis = {
  simpleToken: parseFile(rootPrefix + '/contracts/abi/SimpleToken.abi', "utf8"),
  openSTUtility: parseFile(rootPrefix + '/contracts/abi/OpenSTUtility.abi', "utf8"),
  openSTValue: parseFile(rootPrefix + '/contracts/abi/OpenSTValue.abi', "utf8"),
  stPrime: parseFile(rootPrefix + '/contracts/abi/STPrime.abi', "utf8"),
  valueCore: parseFile(rootPrefix + '/contracts/abi/Core.abi', "utf8"),
  valueRegistrar: parseFile(rootPrefix + '/contracts/abi/Registrar.abi', "utf8"),
  utilityRegistrar: parseFile(rootPrefix + '/contracts/abi/Registrar.abi', "utf8"),
  brandedToken: parseFile(rootPrefix + '/contracts/abi/BrandedToken.abi', "utf8"),
  simpleStake: parseFile(rootPrefix + '/contracts/abi/SimpleStake.abi', "utf8")
};

module.exports = coreAbis;
