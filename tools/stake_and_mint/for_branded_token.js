(function () {
  rootPrefix = ".";
  config =require(rootPrefix + '/config.json');

  coreAddresses   = require( rootPrefix + '/config/core_addresses' );

  stakerAddress = config.Members[0].Reserve;
  stakerPassphrase = 'testtest';
  beneficiary = stakerAddress;
  toStakeAmount = 10;

  btKlass    = require( rootPrefix + '/lib/contract_interact/branded_token' );

  stPrime = new btKlass( config.Members[0] );

  util = require(rootPrefix + "/tools/stake_and_mint/util");

  util(stakerAddress, stakerPassphrase, beneficiary, toStakeAmount, stPrime);

})();