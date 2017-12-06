const Express = require('express');

const reqPrefix         = ".."
  , responseHelper      = require(reqPrefix + "/lib/formatter/response")
;

var router = Express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const rootResponse = responseHelper.successWithData({});
  rootResponse.renderResponse( res );
});



module.exports = router;
