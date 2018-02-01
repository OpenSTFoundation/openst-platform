"use strict";

/**
 * Approve OpenSTValue contract for starting the stake and mint process.
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
;

const openSTValueContractInteract = new OpenSTValueKlass()
;

const startStake = function (beneficiary, toStakeAmount, uuid) {

  toStakeAmount = new BigNumber(toStakeAmount);

  const stakerAddress = coreAddresses.getAddressForUser('staker')
    , stakerPassphrase = coreAddresses.getPassphraseForUser('staker');

  return openSTValueContractInteract.stake(
    stakerAddress,
    stakerPassphrase,
    uuid,
    toStakeAmount.toString(10),
    beneficiary,
    true
  )

};

module.exports = startStake;