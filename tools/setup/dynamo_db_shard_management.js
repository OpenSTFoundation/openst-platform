'use strict';
/**
 * Dynamo DB shard management
 *
 * one time migrations to be run for setup
 *
 * @module tools/setup/dynamo_db_shard_management
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/lib/web3/providers/storage');

/**
 * Dynamo db shard management
 *
 * @constructor
 */
const DynamoDBShardManagement = function(configStrategy, instanceComposer) {};

DynamoDBShardManagement.prototype = {
  perform: async function() {
    const oThis = this,
      openSTStorageProvider = oThis.ic().getStorageProvider(),
      openSTStorage = openSTStorageProvider.getInstance();

    // run migrations
    logger.info('* Running DynamoDB initial migrations for shard management.');
    let shardMgmtObj = openSTStorage.dynamoDBService.shardManagement();
    await shardMgmtObj.runShardMigration();
  }
};

InstanceComposer.register(DynamoDBShardManagement, 'getSetupDynamoDBShardManagement', false);

module.exports = DynamoDBShardManagement;
