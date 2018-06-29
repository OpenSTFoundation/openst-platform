const assert = require('assert')
  , sinon = require('sinon')
  , mock = require('mock-require');

const rootPrefix = "../../../..";

let levelDBFactory;

describe('Level DB Factory', function () {

  before(async () => {

    mock('leveldown', sinon.fake());
    mock('levelup', sinon.fake());

    levelDBFactory = require(rootPrefix + '/lib/db/leveldb');
  });
  it('should create new instance of new db path', function () {

    levelDBFactory.getInstance(__dirname);
    let numberOfInstance = Object.keys(levelDBFactory.instanceMap).length;
    assert.equal(numberOfInstance, 1);
  });

  it('should not create new instance of same db path', function () {
    levelDBFactory.getInstance(__dirname);
    let numberOfInstance = Object.keys(levelDBFactory.instanceMap).length;
    assert.equal(numberOfInstance, 1);
  });

  it('should not create new instance of same db path but different case', function () {

    levelDBFactory.getInstance(__dirname.toUpperCase());
    let numberOfInstance = Object.keys(levelDBFactory.instanceMap).length;
    assert.equal(numberOfInstance, 1);
  });
  after(async () => {
    mock.stop('leveldown');
    mock.stop('levelup');
  });
});


