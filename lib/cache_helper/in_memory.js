'use strict';

const rootPrefix = "../.."
  , Base = require(rootPrefix + '/lib/cache_helper/base');

const InMemory = module.exports = function() {

};

InMemory.prototype = Object.create(Base.prototype);

InMemory.prototype.constructor = InMemory;

InMemory.prototype.connect = function(){

}