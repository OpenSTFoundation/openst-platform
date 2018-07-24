'use strict';

/**
 * Get branded token details class
 *
 * @module services/utils/get_branded_token_details
 */

const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/openst_value');

/**
 * Constructor for get branded token details class
 *
 * @param {object} params
 * @param {string} params.uuid - Branded Token UUID
 *
 * @constructor
 */
const GetBrandedTokenDetailsKlass = function(params) {
  const oThis = this;

  params = params || {};
  oThis.uuid = params.uuid;
};

GetBrandedTokenDetailsKlass.prototype = {
  /**
   *
   * Perform
   *
   * @return {Promise}
   *
   */
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error('openst-platform::services/utils/get_branded_token_details.js::perform::catch');
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 's_u_gbtd_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        });
      }
    });
  },

  /**
   * asyncPerform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      openSTValueContractName = 'openSTValue',
      openSTValueContractAddr = coreAddresses.getAddressForContract(openSTValueContractName),
      OpenSTValueKlass = oThis.ic().getOpenSTValueInteractClass(),
      openSTValue = new OpenSTValueKlass(openSTValueContractAddr);

    // validations
    if (!basicHelper.isUuidValid(oThis.uuid)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_u_gbtd_2',
        api_error_identifier: 'invalid_branded_token_uuid',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    var tokenDetails = await openSTValue.utilityTokens(oThis.uuid);

    return tokenDetails;
  }
};

InstanceComposer.registerShadowableClass(GetBrandedTokenDetailsKlass, 'getBrandedTokenDetailsService');

module.exports = GetBrandedTokenDetailsKlass;
