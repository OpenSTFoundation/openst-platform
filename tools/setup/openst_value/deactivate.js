"use strict";

/**
 * Set Admin Address on OpenSt Value Contract
 *
 * @module tools/setup/openst_value/deactivate
 */

const rootPrefix = "../../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , InstanceComposer = require(rootPrefix + '/instance_composer')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/openst_value');

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

    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
      , OpenSTValue = oThis.ic().getOpenSTValueInteractClass()
      , openSTValueAddr = coreAddresses.getAddressForContract('openSTValue')
      , openSTValue = new OpenSTValue(openSTValueAddr)
    ;

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

  }

};

InstanceComposer.register(DeactivateKlass, 'getOstValueDeactivator', false);

module.exports = DeactivateKlass;