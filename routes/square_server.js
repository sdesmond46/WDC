var express = require('express');
var request = require('request');
var router = express.Router();

var clientId = process.env.APPSETTING_Square_ClientId;
var appSecret = process.env.APPSETTING_Square_AppSecret;

if (!clientId || !appSecret) {
   throw "Your Square client id or app secret are not defined. These values must be defined as the environment variables APPSETTING_Square_ClientId & APPSETTING_Square_AppSecret";
}

// define the home page route
router.get('/', function(req, res) {
  res.render('square', { authLink: 'https://connect.squareup.com/oauth2/authorize?client_id=' + clientId });
});

router.get('/redirect', function(req, res) {
  var code = req.query.code;
  console.log("Code is " + code);

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