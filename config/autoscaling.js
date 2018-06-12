"use strict";

const rootPrefix = '..'
    , coreConstants = require(rootPrefix + '/config/core_constants');

// Dynamo DB connection config details
var autoScalingConfig = {
  'apiVersion': process.env.OS_AUTOSCALING_API_VERSION,
  'accessKeyId': process.env.OS_AUTOSCALING_ACCESS_KEY_ID,
  'secretAccessKey': process.env.OS_AUTOSCALING_SECRET_ACCESS_KEY,
  'region': process.env.OS_AUTOSCALING_REGION,
  'endpoint': process.env.OS_AUTOSCALING_ENDPOINT
}

if (process.env.OS_AUTOSCALING_SSL_ENABLED == 1) {
  autoScalingConfig['sslEnabled'] = true;
} else {
  autoScalingConfig['sslEnabled'] = false;
}

if (process.env.OS_AUTOSCALING_LOGGING_ENABLED == 1) {
  autoScalingConfig['logger'] = console;
}

module.exports = autoScalingConfig;
