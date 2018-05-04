"use strict";

/**
 * Get branded token details class
 *
 * @module services/utils/get_branded_token_details
 */

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const openSTValueContractName = 'openSTValue'
  , openSTValueContractAddr = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTValue = new OpenSTValueKlass(openSTValueContractAddr)
;

/**
 * Constructor for get branded token details class
 *
 * @param {object} params
 * @param {string} params.uuid - Branded Token UUID
 *
 * @constructor
 */
const GetBrandedTokenDetailsKlass = function (params) {
  const oThis = this;

  params = params || {};
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

    // validations
    if (!basicHelper.isUuidValid(oThis.uuid)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_u_gbtd_1',
        api_error_identifier: 'invalid_branded_token_uuid',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    var tokenDetails = await openSTValue.utilityTokens(oThis.uuid);

    return tokenDetails;
  }
};

module.exports = GetBrandedTokenDetailsKlass;