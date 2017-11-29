(async function () {
  const rootPrefix = '..';
  const coreAddresses = require(rootPrefix+'/config/core_addresses');
  const initKlass = require(rootPrefix+'/tools/init_utility_token');
  const initKlassObj = new initKlass;
  var btSymbol = 'ACME';
  var btName = 'ACMECoprCoin';
  var apiAuthUser = "acme";
  var apiAuthSecret = "acmesecret";
  var btConversion = 10;
  var apiCallbackUrl = "http://localhost:9000"

  var newMemberInfo = await initKlassObj.newMemberWithConfig(btSymbol, btName, apiAuthUser, apiAuthSecret, apiCallbackUrl);
  var memberAddress = newMemberInfo.address;
  var memberPassphrase = newMemberInfo.passphrase;
  var memberConfig = newMemberInfo.config;

  const fundMember = require( rootPrefix + '/test/fundMember');
  
  await fundMember( memberConfig );


  initKlassObj.propose(memberAddress, memberPassphrase, btSymbol, btName, btConversion);
})();