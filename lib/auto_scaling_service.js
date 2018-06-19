"use strict";

/*
 * Autoscaling Service Object
 */

const rootPrefix = '..'
    , coreConstants = require(rootPrefix + '/config/core_constants')
;

var autoscalingServiceObj = null;

// Don't remove CR_ENVRIONMENT check, it will be used during setup from saas
if (coreConstants.AUTO_SCALE_DYNAMO != 0 && process.env.CR_ENVIRONMENT != 'development') {
  const OSTStorage = require('@openstfoundation/openst-storage')
      , autoScalingConfig = require(rootPrefix + '/config/autoscaling')
  ;

  autoscalingServiceObj = new OSTStorage.AutoScaling(autoScalingConfig);
}

module.exports = autoscalingServiceObj;