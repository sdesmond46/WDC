var express = require('express');
var router = express.Router();
var request = require('request');

var OAuth2 = require('OAuth').OAuth2; 

var clientId = process.env.APPSETTING_Square_ClientId;
var appSecret = process.env.APPSETTING_Square_AppSecret;

var oauth2 = new OAuth2(
  'https://api.twitter.com/', null, 'oauth2/token', null);


var accessToken;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
  }, function (e, access_token) {
    accessToken = access_token;
    console.log(access_token); //string that we can use to authenticate request
});

// define the home page route
router.get('/', function(req, res) {
  res.render('twitter', { });
});

router.get('/accessToken', function(req, res) {
  res.send('Code is blah');
});

router.get('/searchTwitter', function(req, res) {
  var query = req.query.q;
  console.log("Query was " + query);
  
  var oauth_request_headers = { 'Authorization':  'Bearer ' + accessToken,
                          'Accept': 'application/json'}

  var options = {
    method: 'GET',
    url: 'https://api.twitter.com/1.1/search/tweets.json?' + "result_type=recent&count=15&q=" + query,
    headers: oauth_request_headers
  };

  request(options, function (error, response, body) {
    if (!error) {
       var parsedData = JSON.parse(body);
       var searchMetadata = parsedData.search_metadata;
       console.log(JSON.stringify(searchMetadata));
       console.log(parsedData.statuses);
       res.send(JSON.stringify(parsedData.statuses));
    } else {
      console.log(error);
    }
  });
});
  
module.exports = router;