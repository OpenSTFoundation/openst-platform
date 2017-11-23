const Express = require('express');
const Geth = require('../lib/geth');

var router = Express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



module.exports = router;
