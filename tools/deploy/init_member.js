(function () {
  const rootPrefix = '../..';
  const coreAddresses = require(rootPrefix+'/config/core_addresses');
  const initKlass = require(rootPrefix+'/tools/init_utility_token');
  const initKlassObj = new initKlass;
  var btSymbol = 'XYZsdasdas';
  var btName = 'xyzCosadasin';
  var btConversion = 10;

  initKlassObj.propose(coreAddresses.getAddressForUser('foundation'), coreAddresses.getPassphraseForUser('foundation'), btSymbol, btName, btConversion);
})();