'use strict';

/*
 * Dynamodb Service Object
 */

const OSTStorage = require('@openstfoundation/openst-storage'),
  BaseClass = OSTStorage.Dynamodb;

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer');
require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/autoscaling');
require(rootPrefix + '/config/dynamoDB');

const DynamoDb = function(configStrategy, instanceComposer) {
  const oThis = this,
    dynamodbConnectionParams = instanceComposer.getDynamoDbConfig(),
    coreConstants = instanceComposer.getCoreConstants();
  BaseClass.call(oThis, dynamodbConnectionParams);

  if (coreConstants.AUTO_SCALE_DYNAMO != 0 && process.env.CR_ENVIRONMENT != 'development') {
    const autoScalingConfig = instanceComposer.getAutoScalingConfig();
    oThis.autoscalingServiceObj = new OSTStorage.AutoScaling(autoScalingConfig);
  }
};

const _proto = {
  autoscalingServiceObj: null
};

DynamoDb.prototype = Object.create(BaseClass.prototype || {});
Object.assign(DynamoDb.prototype, _proto);

InstanceComposer.register(DynamoDb, 'getDynamoDb', true);
module.exports = DynamoDb;
