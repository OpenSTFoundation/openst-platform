"use strict";

/**
 * Stake and mint ST Prime
 *
 * @module tools/setup/stake_and_mint_stp
 */

/**
 * Constructor for Deploy simple token contract
 *
 * @constructor
 */
const StakeAndMintSimpleTokenPrime = function () {
};

StakeAndMintSimpleTokenPrime.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    return Promise.resolve();

    // const approverServiceObj = new require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract');
    // const approvalTransactionResponse = await approverServiceObj.perform();
    // console.log(JSON.stringify(approvalTransactionResponse));
  }
};

module.exports = new StakeAndMintSimpleTokenPrime();