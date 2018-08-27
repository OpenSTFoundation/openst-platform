"use strict";

/**
 * Set Admin Address on OpenSt Value Contract
 *
 * @module tools/setup/openst_value/set_admin_address
 */

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , OpenSTValue = require(rootPrefix + '/lib/contract_interact/openst_value')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
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
const SetAdminAddressKlass = function () {

  const oThis = this;

};

SetAdminAddressKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise}
   */
  perform: async function () {

    const oThis = this
      , openSTValueAddr = coreAddresses.getAddressForContract('openSTValue')
      , valueDeployerAddr = coreAddresses.getAddressForUser('valueDeployer')
      , openSTValue = new OpenSTValue(openSTValueAddr)
      , adminAddress = coreAddresses.getAddressForUser('valueAdmin')
    ;

    if (!adminAddress) {
      return Promise.reject('Admin Address to set is missing');
    }

    logger.step("** openSTValueAddr: ", openSTValueAddr);
    logger.step("** adminAddr would be set to: ", adminAddress);
    logger.step("** adminAddr would be set by : ", valueDeployerAddr);

    await openSTValue.setAdminAddress('valueDeployer', adminAddress, {});

    const openSTValueAdminAddressResponse = await openSTValue.getAdminAddress()
      , openSTValueAdminAddress = openSTValueAdminAddressResponse.data.address;

    // check if the admin address is correctly set.
    if(!openSTValueAdminAddress || !openSTValueAdminAddress.equalsIgnoreCase(adminAddress)){
      return Promise.reject('Admin Address not correctly set');
    } else {
      logger.step('** successfully verified admin address');
      return Promise.resolve(responseHelper.successWithData({}));
    }

  }

};

module.exports = new SetAdminAddressKlass();