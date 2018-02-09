"use strict";

/**
 * Registration status
 *
 * @module helpers/registration_status
 */

const rootPrefix = '..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;


/**
 * Registration status
 *
 * @constructor
 *
 */
const RegistrationStatusKlass = function() {
  this.uuid = '';
  this.erc20Address = '';
  this.isProposalDone = 0;
  this.isRegisteredOnUc = 0;
  this.isRegisteredOnVc = 0;
};

RegistrationStatusKlass.prototype = {

  constructor: RegistrationStatusKlass,

  /**
   * convert the RegistrationStatus object to an object
   *
   * @return {object} returns a formatted object of registration status
   */
  toHash: function() {
    const oThis = this
    ;

    return {
      uuid: oThis.uuid,
      erc20_address: oThis.erc20Address,
      is_proposal_done: oThis.isProposalDone,
      is_registered_on_uc: oThis.isRegisteredOnUc,
      is_registered_on_vc: oThis.isRegisteredOnVc
    }
  },

  /**
   * Return promise which resolves to result object
   *
   * @return {promise<result>} returns a Promise which resolves to result object
   */
  returnResultPromise: function() {
    const oThis = this
    ;

    return Promise.resolve(responseHelper.successWithData({registration_status: oThis.toHash()}))
  },

  /**
   * Set UUID
   *
   * @param {string} uuid - uuid to set into the object
   */
  setUuid: function(uuid) {
    const oThis = this
    ;

    oThis.uuid = uuid;
  },

  /**
   * Set ERC 20 address
   *
   * @param {string} erc20Address - ERC20 address to set into the object
   */
  setErc20Address: function(erc20Address) {
    const oThis = this
    ;

    oThis.erc20Address = erc20Address;
  },

  /**
   * Set is registered on UC flag
   *
   * @param {number} isRegisteredOnUc - is registered on UC flag
   */
  setIsRegisteredOnUc: function(isRegisteredOnUc) {
    const oThis = this
    ;

    oThis.isRegisteredOnUc = isRegisteredOnUc;
  },

  /**
   * Set is registered on VC flag
   *
   * @param {number} isRegisteredOnVc - is registered on VC flag
   */
  setIsRegisteredOnVc: function(isRegisteredOnVc) {
    const oThis = this
    ;

    oThis.isRegisteredOnVc = isRegisteredOnVc;
  },

  /**
   * Set is proposal done
   *
   * @param {number} isProposalDone - is proposal done
   */
  setIsProposalDone: function(isProposalDone) {
    const oThis = this
    ;

    oThis.isProposalDone = isProposalDone;
  }
};

module.exports = RegistrationStatusKlass;