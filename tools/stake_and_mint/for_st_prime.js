/**
 * This script does stake of simple token on the value chain and mint of simple token prime on the utility chain.
 * Here staker account for ST and beneficiary account for simple token prime is utility chain owner.<br><br>
 *
 *   Following are the steps which are performed in this script:<br>
 *     <ol>
 *       <li>Call stake and mint util with required params for doing the actual transactions on contracts.
 *       ref: {@link module:tools/stake_and_mint/util}</li>
 *     </ol>
 *
 * @module tools/stake_and_mint/for_st_prime
 */

(function () {
  const rootPrefix = "../.."
    , coreAddresses   = require( rootPrefix + '/config/core_addresses' )
    , coreConstants   = require( rootPrefix + '/config/core_constants' )
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