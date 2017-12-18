const Express = require('express');

const reqPrefix         = ".."
  , coreConstants       = require( reqPrefix + '/config/core_constants' )
  , responseHelper      = require(reqPrefix + "/lib/formatter/response")
;

var router = Express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // const rootResponse = responseHelper.successWithData({});
  // rootResponse.renderResponse( res );
  if(coreConstants.ENVIRONMENT == 'production'){
    res.redirect('https://simpletoken.org/');
  } else {
    res.redirect('https://stagingsimpletoken.org');
  }

});



module.exports = router;
