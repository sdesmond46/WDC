var express = require('express');
var router = express.Router();
var request = require('request');

var OAuth2 = require('OAuth').OAuth2; 

// Need a long 64 bit integer to do the addition
var Long = require("long");

var clientId = process.env.APPSETTING_Twitter_ClientId;
var appSecret = process.env.APPSETTING_Twitter_AppSecret;

var oauth2 = new OAuth2(
  clientId,
  appSecret, 
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

function getHeaders() {
  var columns = [
    ["text", "string"],
    ["retweeted", "bool"],
    ["created_at", "datetime"],
    ["favorite_count", "int"],
    ["id_str", "string"],
    ["in_reply_to_screen_name", "string"],
    ["in_reply_to_status_id_str", "string"],
    ["lang", "string"],
    ["retweet_count", "int"],
    ["source", "string"]
  ];
  
  return columns;
}

router.get('/headers', function(req, res) {
  
  res.send(getHeaders());
});

function getUrl(userId, lastId) {
  var max_id_str = "";
  if (!!lastId) {
    var max_id = Long.fromString(lastId);
    max_id = max_id.add(-1);
    max_id_str = max_id.toString();
  }
  
  
  var url = "https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name=" + userId; 
  if (!!lastId) {
    url += "&max_id=" + max_id_str;
  }
  
  console.log("url is '" + url + "'");
  return url;
}

function getData(userId, lastId, columns, outDataArray, doneCallback) {
    var oauth_request_headers = { 'Authorization':  'Bearer ' + accessToken, 'Accept': 'application/json'};
    
    var options = {
      method: 'GET',
      url: getUrl(userId, lastId),
      headers: oauth_request_headers
    };
                          
                          
  request(options, function (error, response, body) {
    if (!error) {
      console.log("Received Successful response");
        var parsedData = JSON.parse(body);
        for(var i = 0; parsedData && parsedData.length && i < parsedData.length; i++) {
          var status = parsedData[i];
          var rowData = {};
          for(var j=0; j<columns.length; j++) {
            var col = columns[j];
            var data = status[col[0]];
            if (col[1] == "datetime" || col[1] == "date") {
              data = (new Date(data)).toISOString();
            } else if (col[1] == "string" && data) {
              data = data.replace(/(?:\r\n|\r|\n)/g, "\\n");
            }
            
            rowData[col[0]] = data;
          }
          
          outDataArray.push(rowData);
        }
        
        if (!parsedData || parsedData.length == 0 || outDataArray.length >= 3200) {
          console.log("Finsihed final response. NOR is " + outDataArray.length);
          doneCallback();
        } else {
          console.log("Getting more data. NOR is " + outDataArray.length);
          getData(userId, outDataArray[outDataArray.length - 1].id_str, columns, outDataArray, doneCallback);
        }
    } else {
      console.log(error);
    }
  });
}

router.get('/tableData', function(req, res) {
  var query = req.query.q;
  console.log("Query was " + query);

  var data = [];
  
  getData(query, undefined, getHeaders(), data, function() {
    res.send(data);
  });
  
  // getData('https://api.twitter.com/1.1/search/tweets.json?' + "result_type=recent&count=100&q=" + query, getHeaders(), data, function() {
  //   res.send(data);
  // });
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