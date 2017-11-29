"use strict";

/*
 * Load all contract abi files
 *
 */

const fs = require('fs');

const coreAbis = {
    simpleToken: JSON.parse(fs.readFileSync('./contracts/abi/SimpleToken.abi', "utf8")),
    openSTUtility: JSON.parse(fs.readFileSync('./contracts/abi/OpenSTUtility.abi', "utf8")),
    openSTValue: JSON.parse(fs.readFileSync('./contracts/abi/OpenSTValue.abi', "utf8")),
    stPrime: JSON.parse(fs.readFileSync('./contracts/abi/STPrime.abi', "utf8")),
    valueCore: JSON.parse(fs.readFileSync('./contracts/abi/Core.abi', "utf8")),
    valueRegistrar: JSON.parse(fs.readFileSync('./contracts/abi/Registrar.abi', "utf8")),
    utilityRegistrar: JSON.parse(fs.readFileSync('./contracts/abi/Registrar.abi', "utf8")),
    staking: '',
    brandedToken: JSON.parse(fs.readFileSync('./contracts/abi/BrandedToken.abi', "utf8")),
    simpleStake: JSON.parse(fs.readFileSync('./contracts/abi/SimpleStake.abi', "utf8"))
  };

module.exports = coreAbis;
