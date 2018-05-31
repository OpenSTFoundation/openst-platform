"use strict";

/*
 * Autoscaling Service Object
 */

const rootPrefix = '..'
    , coreConstants = require(rootPrefix + '/config/core_constants')
;

var autoscalingServiceObj = null;

if (coreConstants.ENVIRONMENT != 'development') {
  const OSTStorage = require('@openstfoundation/openst-storage')
      , autoScalingConfig = require(rootPrefix + '/config/autoscaling')
  ;

  autoscalingServiceObj = new OSTStorage.AutoScaling(autoScalingConfig);
}

module.exports = autoscalingServiceObj;