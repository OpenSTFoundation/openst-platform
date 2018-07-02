const assert = require('assert');

const rootPrefix = '../..'
  , SyncKlass = require(rootPrefix + '/services/sync/sync')
;


describe
('Sync service', function () {

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


})
;