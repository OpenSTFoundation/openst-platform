'use strict';
/**
 * Dynamo DB create and register shards
 *
 * Utility chain specific creation and registration of shards
 *
 * @module tools/setup/dynamo_db_register_shards
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/lib/web3/providers/storage');

/**
 * Dynamo db create and register shards
 *
 * @constructor
 */
const DynamoDBRegisterShards = function(configStrategy, instanceComposer) {};

DynamoDBRegisterShards.prototype = {
  perform: async function() {
    const oThis = this,
      openSTStorageProvider = oThis.ic().getStorageProvider(),
      openSTStorage = openSTStorageProvider.getInstance();

    let shardName = 'tokenBalancesShard_' + setupHelper.chainIdFor('utilty');

    // createAndRegisterShard
    logger.info('* Creating and registering shard for token balance model.');
    await new openSTStorage.model.TokenBalance({}).createAndRegisterShard(shardName);
  }
};

InstanceComposer.register(DynamoDBRegisterShards, 'getSetupDynamoDBRegisterShards', false);

module.exports = DynamoDBRegisterShards;
