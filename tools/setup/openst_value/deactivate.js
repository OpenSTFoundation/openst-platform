"use strict";

/**
 * Set Admin Address on OpenSt Value Contract
 *
 * @module tools/setup/openst_value/set_admin_address
 */

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , OpenSTValue = require(rootPrefix + '/lib/contract_interact/openst_value')
;

const openSTValueAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTValue = new OpenSTValue(openSTValueAddr)
;

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
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
const DeactivateKlass = function (senderAddress, senderPassphrase) {

  const oThis = this;

  oThis.senderAddress = senderAddress;
  oThis.senderPassphrase = senderPassphrase;

};

DeactivateKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise}
   */
  perform: async function () {

    const oThis = this;

    if (!oThis.senderAddress) {
      return Promise.reject('Sender Address missing');
    }

    if (!oThis.senderPassphrase) {
      return Promise.reject('Sender senderPassphrase is missing');
    }

    logger.step("** openSTValueAddr: ", openSTValueAddr);
    logger.step("** sender : ", oThis.senderAddress);
    logger.step("** sender passphrase: ", oThis.senderPassphrase);

    let deactivateRsp = await openSTValue.deactivate(oThis.senderAddress, oThis.senderPassphrase);
    logger.step('deactivateRsp', deactivateRsp.toHash());

    // const openSTValueAdminAddressResponse = await openSTValue.getAdminAddress()
    //   , openSTValueAdminAddress = openSTValueAdminAddressResponse.data.address;
    //
    // // check if the admin address is correctly set.
    // if(!openSTValueAdminAddress || !openSTValueAdminAddress.equalsIgnoreCase(oThis.adminAddress)){
    //   return Promise.reject('Admin Address not correctly set');
    // } else {
    //   logger.step('** successfully verified admin address');
    //   return Promise.resolve(responseHelper.successWithData({}));
    // }

  }

};

module.exports = DeactivateKlass;