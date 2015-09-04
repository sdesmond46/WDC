var express = require('express');
var request = require('request');
var router = express.Router();

// define the home page route
router.get('/', function(req, res) {
  res.render('square', { authLink: 'https://connect.squareup.com/oauth2/authorize?client_id=SVyXv5a4MuWGOlaYpgWuzA' });
});

router.get('/redirect', function(req, res) {
  var code = req.query.code;
  console.log("Code is " + code);

  var clientId = "SVyXv5a4MuWGOlaYpgWuzA";
  var appSecret = "W8I8Mf7YPPvePDiAseGJTZgqghP_-U9TIt2W9VlraJ8";
  var requestObject = {
      'client_id': clientId,
      'client_secret': appSecret,
      'code': code
  };

  var oauth_request_headers = { 'Authorization': 'Client ' + appSecret,
                          'Accept': 'application/json',
                          'Content-Type': 'application/json'}

  var options = {
    method: 'POST',
    url: 'https://connect.squareup.com/oauth2/token',
    headers: oauth_request_headers,
    json : requestObject
  };

  request(options, function (error, response, body) {
    if (!error) {
      console.log(body);
      var accessToken = body.access_token;
      res.cookie('accessToken', accessToken, { });
      res.redirect('./');
    } else {
      console.log(error);
    }
  });
})

module.exports = router;