'use strict';

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Base = require(rootPrefix + '/cache_helper/base');

const InMemory = module.exports = function () {

};

Memcache.prototype = Object.create(Base.prototype);

InMemory.prototype = {

  connect: function(){

  },

  get: function (key) {

  },

  set: function (key, val, expiry) {

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