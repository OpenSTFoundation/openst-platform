const leveldown = require('leveldown')
  , levelup = require('levelup')
;

/**
 * @constructor
 */
function LevelDBFactory() {
  this.instanceMap = {};
}

LevelDBFactory.prototype = {
  /**
   * Returns leveldb instance, it creates new in not already exists  otherwise returns existing instance
   * @param dbPath
   * @return leveldb instance
   */
  getInstance: function (dbPath) {
    const oThis = this;

    let lowerCasePath = dbPath.toLowerCase();

    if (!oThis.instanceMap[lowerCasePath]) {
      oThis.instanceMap[lowerCasePath] = oThis.create(lowerCasePath);
    }
    return oThis.instanceMap[lowerCasePath];
  },

  /**
   *
   * @param dbPath
   * @return leveldb instance
   */
  create: function (dbPath) {
    return levelup(leveldown(dbPath));
  },
};
module.exports = new LevelDBFactory();