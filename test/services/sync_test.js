const assert = require('assert')

  , sinon = require('sinon')
  , mock = require('mock-require')
;
const rootPrefix = '../..'
;


describe('Sync service', function () {
  let RSyncStub, cb, errorCode;

  before(function () {

    RSyncStub = sinon.spy();
    let instance = new RSyncStub()
    RSyncStub.prototype.flags = sinon.stub().returns(instance);
    RSyncStub.prototype.source = sinon.stub().returns(instance);
    RSyncStub.prototype.destination = sinon.stub().returns(instance);
    RSyncStub.prototype.execute = function (cb) {
      cb(errorCode, 0);
    };
    mock('rsync', RSyncStub);
    SyncKlass = require(rootPrefix + '/services/sync/sync')
    cb = function (error, code, cmd) {
      //placeholder callback function
    };
  });

  it('should not sync data is source path is missing ', async function () {
    let sourceConfig = {
        user: "user",
        host: "10.1.1.1",
      },
      destinationConfig = {
        path: "~/tmp"
      };

    let syncService = new SyncKlass(sourceConfig, destinationConfig);

    try {
      await syncService.perform();
    } catch (error) {
      assert.equal(error.apiErrorIdentifier, 'sync_source_undefined')
    }
  });


  it('should not sync data is destination path is missing ', async function () {
    let sourceConfig = {
        user: "user",
        host: "10.1.1.1",
        path: "~/tmp"
      },
      destinationConfig = {};
    let syncService = new SyncKlass(sourceConfig, destinationConfig);

    try {
      await syncService.perform();
    } catch (error) {
      assert.equal(error.apiErrorIdentifier, 'sync_destination_undefined')
    }
  });


  it('should format path for local path', async function () {
    let path = "~/tmp";
    let sourceConfig = {
        path: path
      },
      destinationConfig = {};

    let syncService = new SyncKlass(sourceConfig, destinationConfig);

    let formatPath = syncService._formatPath(sourceConfig);
    assert.equal(formatPath, path);

  });

  it('should format path for remote path', async function () {
    let path = "~/tmp"
      , host = "10.1.1.1"
      , user = "user";
    let sourceConfig = {
        user: user,
        host: host,
        path: path
      },
      destinationConfig = {};

    let syncService = new SyncKlass(sourceConfig, destinationConfig);
    let formatPath = syncService._formatPath(sourceConfig);
    assert.equal(formatPath, `${user}@${host}:${path}`);
  });

  it('should form correct rsync command', async function () {

    let sourceConfig = {
        user: "user",
        host: "10.1.1.1",
        path: "~/tmp"
      },
      destinationConfig = {
        path: "~/tmp"
      },
      syncService = new SyncKlass(sourceConfig, destinationConfig);

    await syncService.perform();
    assert.equal(RSyncStub.prototype.flags.called, true);
    assert.equal(RSyncStub.prototype.source.called, true);
    assert.equal(RSyncStub.prototype.destination.called, true);
  });


  it('should fail if rync fails ', async function () {

    let sourceConfig = {
        user: "user",
        host: "10.1.1.1",
        path: "~/tmp"
      },
      destinationConfig = {
        path: "~/tmp"
      },
      syncService = new SyncKlass(sourceConfig, destinationConfig);
    errorCode = 1;

    try {
      await syncService.perform();
    }
    catch (error) {

      assert.equal(error.apiErrorIdentifier, 'rsync_failed');
      assert.equal(RSyncStub.prototype.flags.called, true);
      assert.equal(RSyncStub.prototype.source.called, true);
      assert.equal(RSyncStub.prototype.destination.called, true);
    }
  });


  it('should return success if rsync was success ', async function () {

    let sourceConfig = {
        user: "user",
        host: "10.1.1.1",
        path: "~/tmp"
      },
      destinationConfig = {
        path: "~/tmp"
      },
      syncService = new SyncKlass(sourceConfig, destinationConfig);
    errorCode = undefined;

    let result = await syncService.perform();

    assert.equal(result.success, true);
    assert.equal(RSyncStub.prototype.flags.called, true);
    assert.equal(RSyncStub.prototype.source.called, true);
    assert.equal(RSyncStub.prototype.destination.called, true);
  });
});