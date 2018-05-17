"use strict";

/**
 * Approve OpenSTUtility contract for starting the redeem and unstake process.
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
;

const openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
;

/**
 * Get BT balance
 *
 * @param {object} brandedToken - Branded Token Contract Interact object.
 * @param {string} address - Address for which the branded token balance is to be found.
 *
 * @return {Promise<BigNumber>}
 */
const getBTBalance = function (brandedToken, address) {
  logger.step(
    'Getting BT Balance of account: ',
    address,
    'for BT ERC20 contract: ',
    brandedToken._getBTAddress()
  );

  return brandedToken.getBalanceOf(address).then(
    function (result) {
      if (result.isSuccess()) {
        const btBalance = result.data.balance;

        logger.win(
          'BT Balance of account: ',
          address,
          ' obtained.'
        );

        return new BigNumber(btBalance);

      } else {
        return Promise.reject('Unable to get balance of the redeemer.')
      }
    }
  );
};

/**
 * Approve
 *
 * @param {object} brandedToken - Branded Token Contract Interact object.
 * @param {String} redeemerAddress - Redeemer address
 * @param {String} redeemerPassphrase - Redeemer address passphrase
 * @param {Number} toApproveAmount - to approve amount
 *
 * @return {Promise}
 */
const approve = function (brandedToken, redeemerAddress, redeemerPassphrase, toApproveAmount) {
  // following functionality might be broken. Please check when opening it.
  return brandedToken.approve(
    redeemerAddress,
    redeemerPassphrase,
    openSTUtilityContractAddress,
    toApproveAmount,
    true // we need this to be done in async and not to wait for the tx to get mined.
  );
};

/**
 * Approve Open ST Utility contract
 *
 * @param {String} erc20Address - Redeemer address
 *
 * @return {Promise}
 */
const approveOpenStUtilityContract = function (erc20Address) {

  const brandedToken = new BrandedTokenKlass({ERC20: erc20Address})
    , redeemerAddress = coreAddresses.getAddressForUser('redeemer')
    , redeemerPassphrase = coreAddresses.getPassphraseForUser('redeemer');

  return getBTBalance(brandedToken, redeemerAddress)
    .then(function (bigBTBalance) {
      return approve(
        brandedToken,
        redeemerAddress,
        redeemerPassphrase,
        bigBTBalance
      );
    })
};

module.exports = approveOpenStUtilityContract;