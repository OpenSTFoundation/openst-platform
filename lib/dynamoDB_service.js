"use strict";

/*
 * Dynamodb Service Object
 */

const OSTStorage = require('@openstfoundation/openst-storage');

const rootPrefix = '..'
  , dynamodbConnectionParams = require(rootPrefix + '/config/dynamoDB')
  , ddbServiceObj = new OSTStorage.Dynamodb(dynamodbConnectionParams)
;

module.exports = ddbServiceObj;