var uuid = require('uuid');
module.exports = function(options) {
  return function(req, res, next) {
    req.id = options.worker_id + ":" + uuid.v4();
    next()
  }
}