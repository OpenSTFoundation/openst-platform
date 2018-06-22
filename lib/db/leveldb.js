const leveldown = require('leveldown'),
  levelup = require('levelup');


function LevelDBFactory() {
  this.instanceMap = {};
}

LevelDBFactory.prototype = {

  getInstance: function (dbPath) {
    let oThis = this;
    if (!oThis.instanceMap[dbPath]) {
      oThis.instanceMap[dbPath] = this.create(dbPath);
    }
    return oThis.instanceMap[dbPath];
  },
  create: function (dbPath) {
    return levelup(leveldown(dbPath));
  },
};
module.exports = new LevelDBFactory();