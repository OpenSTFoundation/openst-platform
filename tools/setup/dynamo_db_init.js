"use strict";
/**
 * Dynamo DB init
 *
 * @module tools/setup/dynamo_db_init
 */
const openSTStorage = require('@openstfoundation/openst-storage')
;

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , ddbServiceObj = require(rootPrefix + '/lib/dynamoDB_service')
  // , autoscalingServiceObj = require(rootPrefix + '/lib/auto_scaling_service')
;

/**
 * Dynamo db init
 *
 * @constructor
 */
const DynamoDBInit = function () {};

DynamoDBInit.prototype = {
  perform: async function () {
    // run migrations
    logger.info('* Running DynamoDB initial migrations for shard management.');
    let shardMgmtObj = ddbServiceObj.shardManagement();
    await shardMgmtObj.runShardMigration(ddbServiceObj, null);

    // createAndRegisterShard
    logger.info('* Creating and registering shard for token balance model.');
    await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj
    }).createAndRegisterShard('tokenBalancesShard1')
  }
};

new DynamoDBInit().perform();