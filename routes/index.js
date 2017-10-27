const Express = require('express');
const Geth = require('../lib/geth');

var router = Express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/newkey', function(req, res, next) {

  Geth.UtilityChain.eth.personal.newAccount().then(x => {
      res.json({data: x});
    })
    .catch(next);
});

module.exports = router;
