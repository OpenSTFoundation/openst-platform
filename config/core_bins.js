"use strict";

/*
 * Load all contract bin files
 *
 */

const fs = require('fs');

const coreBins = {
  simpleToken: fs.readFileSync('./contracts/bin/SimpleToken.bin', 'utf8'),
  openSTUtility: fs.readFileSync('./contracts/bin/OpenSTUtility.bin', 'utf8'),
  openSTValue: fs.readFileSync('./contracts/bin/OpenSTValue.bin', 'utf8'),
  stPrime: fs.readFileSync('./contracts/bin/STPrime.bin', 'utf8'),
  valueCore: fs.readFileSync('./contracts/bin/Core.bin', 'utf8'),
  valueRegistrar: fs.readFileSync('./contracts/bin/Registrar.bin', 'utf8'),
  utilityRegistrar: fs.readFileSync('./contracts/bin/Registrar.bin', 'utf8'),
  staking: '',
  utilityToken: ''
};

module.exports = coreBins;
