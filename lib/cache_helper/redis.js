'use strict';

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , redisCache = require('redis')
  , Base = require(rootPrefix + '/cache_helper/redis');

const Redis = module.exports = function () {
  connect();
};

Redis.prototype = Object.create(Base.prototype);

Redis.prototype = {

  connect: function(){

  },

  del: function ( key ) {

  },

  getMulti: function(keys){

  },

  increment: function(key, value, expires_in, initial) {

  },

  decrement: function(key, value, expires_in, initial) {

  }

}