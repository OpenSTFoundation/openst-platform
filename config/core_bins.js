const fs = require('fs');

const core_bins = {
  simpleToken: fs.readFileSync('./contracts/bin/SimpleToken.bin', 'utf8'),
  staking: fs.readFileSync('./contracts/bin/Staking.bin', 'utf8'),
  utilityToken: fs.readFileSync('./contracts/bin/UtilityToken.bin', 'utf8')
};

module.exports = core_bins;