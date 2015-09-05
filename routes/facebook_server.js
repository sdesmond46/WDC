var express = require('express');
var router = express.Router();

// define the home page route
router.get('/', function(req, res) {
  res.render('facebook', { });
});

router.get('/redirect', function(req, res) {
  res.render('facebook_redirect', { });
})

module.exports = router;