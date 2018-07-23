"use strict";
/**
 * Dynamo DB init
 *
 * @module tools/setup/dynamo_db_init
 */
const openSTStorage = require('@openstfoundation/openst-storage')
;

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;
require(rootPrefix + '/lib/dynamoDB_service');

/**
 * Dynamo db init
 *
 * @constructor
 */
const DynamoDBInit = function (configStrategy, instanceComposer) {

};

DynamoDBInit.prototype = {
  perform: async function () {
    const oThis = this
      , ddbServiceObj = oThis.ic().getDynamoDb()
    ;
    // run migrations
    logger.info('* Running DynamoDB initial migrations for shard management.');
    let shardMgmtObj = ddbServiceObj.shardManagement();
    await shardMgmtObj.runShardMigration(ddbServiceObj, null);
    
    // createAndRegisterShard
    logger.info('* Creating and registering shard for token balance model.');
    await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: ddbServiceObj.autoScalingServiceObj
    }).createAndRegisterShard('tokenBalancesShard1')
  }
};

InstanceComposer.register(DynamoDBInit, "getSetupDynamoDBInit", false);

module.exports = DynamoDBInit;