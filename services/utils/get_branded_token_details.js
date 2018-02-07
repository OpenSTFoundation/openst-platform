"use strict";

/**
 * Get branded token details class
 *
 * @module services/utils/get_branded_token_details
 */

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
;

const openSTValueContractName = 'openSTValue'
  , openSTValueContractAddr = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTValue = new OpenSTValueKlass(openSTValueContractAddr)
;

/**
 * Constructor for get branded token details class
 *
 * @param {object} params - this is object with keys - uuid
 *
 * @constructor
 */
const GetBrandedTokenDetailsKlass = function (params) {
  oThis.uuid = params.uuid;
};

GetBrandedTokenDetailsKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    const oThis = this
    ;

    return openSTValue.utilityTokenProperties(oThis.uuid);
  }
};

module.exports = GetBrandedTokenDetailsKlass;