"use strict";

/**
 * Finalize Simple Token Contract
 *
 * @module tools/setup/simple_token/finalize
 */

const rootPrefix = "../../.."
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , SimpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
;

const valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
  , valueRegistrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')
;

/**
 * is equal ignoring case
 *
 * @param {String} compareWith - string to compare with
 *
 * @return {Bool} true when equal
 */
String.prototype.equalsIgnoreCase = function ( compareWith ) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self === _compareWith;
};

/**
 * Constructor for finalize simple token contract
 *
 * @constructor
 */
const FinalizeSimpleTokenContractKlass = function () {
};

FinalizeSimpleTokenContractKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise}
   */
  perform: async function () {
    logger.step("** Setting Admin Address of Simple Token Contract to value Registrar");

    await SimpleToken.setAdminAddress('foundation', valueRegistrarAddr, {});
    const simpleTokenAdminAddressResponse = await SimpleToken.getAdminAddress()
      , simpleTokenAdminAddress = simpleTokenAdminAddressResponse.data.address;

    // check if the admin address is correctly set.
    if(!simpleTokenAdminAddress || !simpleTokenAdminAddress.equalsIgnoreCase(valueRegistrarAddr)){
      return Promise.reject('Admin Address not correctly set');
    }

    logger.step("** Finalize Simple Token Contract");
    // finalize the simple token contract
    await SimpleToken.finalize(valueRegistrarAddr, valueRegistrarPassphrase);

    return Promise.resolve();
  }
};

module.exports = new FinalizeSimpleTokenContractKlass();