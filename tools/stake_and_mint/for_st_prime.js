(function () {
  rootPrefix = "../..";
  coreAddresses   = require( rootPrefix + '/config/core_addresses' );
  stakerAddress = coreAddresses.getAddressForUser("foundation");
  stakerPassphrase = coreAddresses.getPassphraseForUser("foundation");
  beneficiary = coreAddresses.getAddressForUser("utilityChainOwner");
  toStakeAmount = 100;

  StPrimeKlass    = require( rootPrefix + '/lib/contract_interact/st_prime' );

  stPrime = new StPrimeKlass( "0xa3b92F52a016DB3e64E17ee780D0f0c0FaFD7E25" );

  util = require(rootPrefix + "/tools/stake_and_mint/util");

  util(stakerAddress, stakerPassphrase, beneficiary, toStakeAmount, stPrime).then(function () {
    console.log("Yoo.. Have Fun!!");
    process.exit(0);
  });

})();