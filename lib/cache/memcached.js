'use strict';

const rootPrefix = "../.."
  , cacheConfig = require(rootPrefix + '/config/cache')
  , memcached = require("memcached")
  , client = new memcached(cacheConfig.MEMCACHE_SERVERS)
  , defaultLifetime = Number(cacheConfig.DEFAULT_TTL)

const memcachedCache = function () {
};

const _private = {
  incr: function(key, value) {
    return new Promise(function (onResolve, onReject) {
      client.incr(key, value, function (err) {
        if(err){          
          onReject(err);
        } else {          
          onResolve();
        }
      });
    });
  },

  decr: function(key, value) {
    return new Promise(function (onResolve, onReject) {
      client.decr(key, value, function (err) {
        if(err){          
          onReject(err);
        } else {          
          onResolve();
        }
      });
    });
  },
};

memcachedCache.prototype = {
  get: function (key) {   
    console.log(client) 
    return new Promise(function (onResolve, onReject) {
      client.get(key, function(err, data) {
        if(err){          
          onReject(err);
        } else {          
          onResolve(data);
        }
      });
    });
  },

  set: function(key, value) {    
    return new Promise(function (onResolve, onReject) {
      client.set(key, value, defaultLifetime, function (err) { 
        if(err){          
          onReject(err);
        } else {          
          onResolve();
        }
      });              
    });    
  },

  del: function(key) {
    return new Promise(function (onResolve, onReject) {
      client.del(key, function(err) {
        if(err){          
          onReject(err);
        } else {          
          onResolve();
        }
      });
    });
  },

  multiGet: function(keys) {
    return new Promise(function (onResolve, onReject) {
      client.getMulti(keys, function(err,data) {
        if(err){          
          onReject(err);
        } else {          
          onResolve(data);
        }
      });
    });
  },
  
  increment: function(key, value, expires_in, initial) {    
      return _private.incr(key,value);
  },
  
  decrement: function(key, value, expires_in, initial) {
    return _private.decr(key,value);
  },

  touch: function (key, lifetime) {
    return new Promise(function (onResolve, onReject) {
      client.touch(key, lifetime, function (err) { 
        if(err){          
          onReject(err);
        } else {          
          onResolve();
        }
      });
    });
  }

};

module.exports = new memcachedCache();
