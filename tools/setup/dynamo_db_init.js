'use strict';
/**
 * Dynamo DB init
 *
 * @module tools/setup/dynamo_db_init
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/lib/web3/providers/storage');

/**
 * Dynamo db init
 *
 * @constructor
 */
const DynamoDBInit = function(configStrategy, instanceComposer) {};

DynamoDBInit.prototype = {
  perform: async function() {
    const oThis = this,
      openSTStorageProvider = oThis.ic().getStorageProvider(),
      openSTStorage = openSTStorageProvider.getInstance();

    // run migrations
    logger.info('* Running DynamoDB initial migrations for shard management.');
    let shardMgmtObj = openSTStorage.dynamoDBService.shardManagement();
    await shardMgmtObj.runShardMigration();

    // createAndRegisterShard
    logger.info('* Creating and registering shard for token balance model.');
    await new openSTStorage.model.TokenBalance({}).createAndRegisterShard('tokenBalancesShard1');
  }
};

InstanceComposer.register(DynamoDBInit, 'getSetupDynamoDBInit', false);

module.exports = DynamoDBInit;
