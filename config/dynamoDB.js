'use strict';

/**
 * Load all the DynamoDB related constants from from config strategy OR define them as literals here and export them.
 *
 * @module config/dynamoDB
 *
 */

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

const DynamoDbConfig = function(configStrategy, instanceComposer) {
  const oThis = this;
  oThis.apiVersion = configStrategy.OS_DYNAMODB_API_VERSION;
  oThis.accessKeyId = configStrategy.OS_DYNAMODB_ACCESS_KEY_ID;
  oThis.secretAccessKey = configStrategy.OS_DYNAMODB_SECRET_ACCESS_KEY;
  oThis.region = configStrategy.OS_DYNAMODB_REGION;
  oThis.endpoint = configStrategy.OS_DYNAMODB_ENDPOINT;

  if (configStrategy.OS_DYNAMODB_SSL_ENABLED == 1) {
    oThis.sslEnabled = true;
  } else {
    oThis.sslEnabled = false;
  }

  if (configStrategy.OS_DYNAMODB_LOGGING_ENABLED == 1) {
    oThis.logger = console;
  }
};

InstanceComposer.register(DynamoDbConfig, 'getDynamoDbConfig', true);

module.exports = DynamoDbConfig;
