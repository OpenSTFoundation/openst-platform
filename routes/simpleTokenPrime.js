const Express = require('express');
const reqPrefix = ".."
      ,STP = require(reqPrefix + "/lib/simpleTokenPrime")
      ,router = Express.Router()
;


router.get('/balanceOf', function(req, res, next) {
  const owner = req.query.owner;
  Promise.resolve(STP.balanceOf(owner))
    .then(weiValue => {
      var ethValue = web3.utils.fromWei( weiValue, "ether" ).toString();
      res.json({data: ethValue});
    })
    .catch(next);
});


module.exports = router;