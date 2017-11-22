const core_abis = {
  simpleToken: JSON.parse(fs.readFileSync('./contracts/abi/SimpleToken.abi', "utf8")),
  staking: JSON.parse(fs.readFileSync('./contracts/abi/Staking.abi', "utf8")),
  utilityToken: JSON.parse(fs.readFileSync('./contracts/abi/UtilityToken.abi', "utf8"))
};

module.exports = core_abis;