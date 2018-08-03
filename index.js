'use strict';

/**
 * Load openST Platform module
 */

const rootPrefix = '.',
  version = require(rootPrefix + '/package.json').version,
  coreAbis = require(rootPrefix + '/config/core_abis'),
  InstanceComposer = require(rootPrefix + '/instance_composer');
require(rootPrefix + '/services/manifest');

const OpenSTPlatform = function(configStrategy) {
  const oThis = this;

  if (!configStrategy) {
    throw 'Mandatory argument configStrategy missing';
  }

  const instanceComposer = (oThis.ic = new InstanceComposer(configStrategy));

  oThis.version = version;

  oThis.services = instanceComposer.getServiceManifest();

  oThis.abis = coreAbis;
};

const getInstanceKey = function(configStrategy) {
  
  return [
    configStrategy.OST_VALUE_GETH_RPC_PROVIDER,
    configStrategy.OST_VALUE_GETH_WS_PROVIDER,
    configStrategy.OST_VALUE_CHAIN_ID,
    configStrategy.OST_UTILITY_GETH_RPC_PROVIDER,
    configStrategy.OST_UTILITY_GETH_WS_PROVIDER,
    configStrategy.OST_CACHING_ENGINE,
    
    configStrategy.AUTO_SCALE_DYNAMO,
    configStrategy.OS_DYNAMODB_API_VERSION,
    configStrategy.OS_DYNAMODB_ACCESS_KEY_ID,
    configStrategy.OS_DYNAMODB_REGION,
    configStrategy.OS_DYNAMODB_ENDPOINT,
    configStrategy.OS_DYNAMODB_SSL_ENABLED,
  
    configStrategy.OS_AUTOSCALING_API_VERSION,
    configStrategy.OS_AUTOSCALING_ACCESS_KEY_ID,
    configStrategy.OS_AUTOSCALING_REGION,
    configStrategy.OS_AUTOSCALING_ENDPOINT,
    configStrategy.OS_AUTOSCALING_SSL_ENABLED
    
  ].join('-');
  
};

const instanceMap = {};

const Factory = function() {};

Factory.prototype = {
  getInstance: function(configStrategy) {
    // check if instance already present
    let instanceKey = getInstanceKey(configStrategy),
      _instance = instanceMap[instanceKey];
    
    if (!_instance) {
      _instance = new OpenSTPlatform(configStrategy);
      instanceMap[instanceKey] = _instance;
    }
    
    return _instance;
  }
};

const factory = new Factory();
OpenSTPlatform.getInstance = function() {
  return factory.getInstance.apply(factory, arguments);
};

module.exports = OpenSTPlatform;
