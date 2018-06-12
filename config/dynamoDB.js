"use strict";

const rootPrefix = '..'
    , coreConstants = require(rootPrefix + '/config/core_constants');

// Dynamo DB connection config details
const ddbConnectionConfig = {
  'apiVersion': process.env.OS_DYNAMODB_API_VERSION,
  'accessKeyId': process.env.OS_DYNAMODB_ACCESS_KEY_ID,
  'secretAccessKey': process.env.OS_DYNAMODB_SECRET_ACCESS_KEY,
  'region': process.env.OS_DYNAMODB_REGION,
  'endpoint': process.env.OS_DYNAMODB_ENDPOINT
};

if (process.env.OS_DYNAMODB_SSL_ENABLED == 1) {
  ddbConnectionConfig['sslEnabled'] = true;
} else {
  ddbConnectionConfig['sslEnabled'] = false;
}

if (process.env.OS_DYNAMODB_LOGGING_ENABLED == 1) {
  ddbConnectionConfig['logger'] = console;
}

module.exports = ddbConnectionConfig;
