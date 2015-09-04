var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var clientSecret = process.env.APPSETTING_Square_AppSecret || "App secret not defined"
  
  res.render('index', { title: clientSecret });
});

module.exports = router;
