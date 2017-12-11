"use strict";

/*
 * Load all contract bin files
 *
 */

const fs = require('fs')
  , path = require('path')
;

function readFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  return fs.readFileSync(filePath, options || "utf8");
}

const rootPrefix = "..";

const coreBins = {
  simpleToken: readFile(rootPrefix + '/contracts/bin/SimpleToken.bin', 'utf8'),
  openSTUtility: readFile(rootPrefix + '/contracts/bin/OpenSTUtility.bin', 'utf8'),
  openSTValue: readFile(rootPrefix + '/contracts/bin/OpenSTValue.bin', 'utf8'),
  stPrime: readFile(rootPrefix + '/contracts/bin/STPrime.bin', 'utf8'),
  valueCore: readFile(rootPrefix + '/contracts/bin/Core.bin', 'utf8'),
  valueRegistrar: readFile(rootPrefix + '/contracts/bin/Registrar.bin', 'utf8'),
  utilityRegistrar: readFile(rootPrefix + '/contracts/bin/Registrar.bin', 'utf8'),
  brandedToken: readFile(rootPrefix + '/contracts/bin/BrandedToken.bin', 'utf8'),
  simpleStake: readFile(rootPrefix + '/contracts/bin/SimpleStake.bin', 'utf8')
};

module.exports = coreBins;
