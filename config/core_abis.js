const core_abis = {
  staking: JSON.parse(fs.readFileSync('./contracts/abi/Staking.abi', "utf8"))
};

module.exports = core_abis;