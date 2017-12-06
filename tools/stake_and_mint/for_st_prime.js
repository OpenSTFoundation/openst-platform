/**
 * Stake And Mint for Simple Token Prime.
 * @module stake_and_mint/for_st_prime
 * @see Stake And Mint for Simple Token Prime
 */

(function () {
  const rootPrefix = "../.."
    , coreAddresses   = require( rootPrefix + '/config/core_addresses' )
    , util = require(rootPrefix + "/tools/stake_and_mint/util")
    , StPrimeKlass    = require( rootPrefix + '/lib/contract_interact/st_prime' )
    , stakerAddress = coreAddresses.getAddressForUser("utilityChainOwner")
    , stakerPassphrase = coreAddresses.getPassphraseForUser("utilityChainOwner")
    , beneficiary = coreAddresses.getAddressForUser("utilityChainOwner")
    , stPrimeContractAddress = coreAddresses.getAddressForContract("stPrime")
    , stPrime = new StPrimeKlass(stPrimeContractAddress)
    , toStakeAmount = 100;

  util(stakerAddress, stakerPassphrase, beneficiary, toStakeAmount, stPrime).then(function () {
    console.log("Yoo.. Have Fun!!");
    process.exit(0);
  });

})();