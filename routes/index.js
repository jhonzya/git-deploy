var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* GET /health  */
router.get('/health', function(req, res, next) {
  res.json({
    res: 'OK'
  });
});

module.exports = router;
