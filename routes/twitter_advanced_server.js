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
  res.render('twitter_advanced', { "loginDisplay": "none" , "searchDisplay" : "block"});
});

router.get('/followers', function(req, res) {
  res.render('twitter_advanced', { "loginDisplay": "block" , "searchDisplay" : "none"});
});

router.get('/accessToken', function(req, res) {
  res.send('Code is blah');
});

function getHeaders() {
  var columns = [
    ["text", "string"],
    // ["retweeted", "bool"],
    ["created_at", "datetime"],
    ["favorite_count", "int"],
    ["id_str", "string"],
    ["in_reply_to_screen_name", "string"],
    ["in_reply_to_status_id_str", "string"],
    ["lang", "string"],
    ["retweet_count", "int"],
    ["source", "string"],
    ["is_retweet", "bool"]
  ];
  
  return columns;
}

function getUserHeaders() {
  var columns = [
    ["default_profile", "bool"],
    ["created_at", "datetime"],
    ["description", "string"],
    ["favourites_count", "int"],
    ["followers_count", "int"],
    ["friends_count", "int"],
    ["geo_enabled", "bool"],
    ["id_str", "string"],
    ["lang", "string"],
    ["listed_count", "int"],
    ["location", "string"],
    ["name", "string"],
    ["protected", "bool"],
    ["screen_name", "string"],
    ["statuses_count", "int"],
    ["time_zone", "string"],
    ["url", "string"],
    ["verified", "bool"],
    ["withheld_in_countries", "string"]
  ];
  
  return columns;
}

router.get('/headers', function(req, res) {
	if (req.query.queryType == "tweets") {
    res.send(getHeaders());
	} else if (req.query.queryType == "followers") {
		res.send(getUserHeaders());
	} else {
		res.status(500).send("Invalid queryType");
	}
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

function getData(oauthToken, userId, lastId, columns, outDataArray, doneCallback) {
  var dataFoundCallback = function (tokenObj, error, response, body) {
    if (!error) {
      console.log("Received Successful response");
        var parsedData = JSON.parse(response);
        for(var i = 0; parsedData && parsedData.length && i < parsedData.length; i++) {
          var status = parsedData[i];
          var rowData = {};
          for(var j=0; j<columns.length; j++) {
            var col = columns[j];
            var data = "";
            if (col[0] == "is_retweet") {
              // Check whether or not this was a retweet
              data = status.hasOwnProperty("retweeted_status");
            } else {
              data = status[col[0]];
              if (col[1] == "datetime" || col[1] == "date") {
                data = (new Date(data)).toISOString();
              }
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
          getData(tokenObj, userId, outDataArray[outDataArray.length - 1].id_str, columns, outDataArray, doneCallback);
        }
    } else {
      console.log(error);
      doneCallback(error.toString());
    }
  };
  
  var tokenReceivedFn = function(tokenError, token) {
    if (tokenError) {
      doneCallback(tokenError);
    } else {
      var url = getUrl(userId, lastId);
      sendOAuthRequest(token, url, dataFoundCallback);
    }
  }
  
  if (!oauthToken) {
    // Try it out using the auth flow
    tokenManager.getToken({
      "statuses": {
        "api" : "/statuses/user_timeline",
        "needed" : 15
      }
      }, 0, tokenReceivedFn);
  } else {
    // we were called with an existing token, just use that
    tokenReceivedFn(null, oauthToken)
  }
}




function getFollowerIds(oauthToken, userId, lastId, outDataArray, doneCallback) {
  var dataFoundCallback = function (tokenObj, error, response, body) {
    if (!error) {
      console.log("Received Successful response to get follower ids");
      var parsedData = JSON.parse(response);
      
      var followerIds = parsedData["ids"];
      var nextToken = parsedData["next_cursor_str"];
      
      console.log("Found " + followerIds.length + " user ids");
      for(var i in followerIds) {
        outDataArray.push(followerIds[i]);
      }
      
      if (outDataArray.length >= 6000 || !nextToken || nextToken == "0") { // return 10,000 ids, but some might be omitted. We're getting back 10,00 so give us some room
        console.log("Finsihed final response. NOR is " + outDataArray.length);
        doneCallback();
      } else {
        console.log("Getting more data. NOR is " + outDataArray.length);
        getFollowerIds(tokenObj, userId, nextToken, outDataArray, doneCallback);
      }
    } else {
      console.log(error);
      doneCallback(error.toString());
    }
  };
  
  var createGetFollowersUrl = function(handle, cursor) {
    if (!cursor) {
      cursor = -1;
    }
    var url = "https://api.twitter.com/1.1/followers/ids.json?count=5000&stringify_ids=true&cursor=" + cursor.toString() + "&screen_name=" + handle;
    return url;
  }
  
  var tokenReceivedFn = function(tokenError, token) {
    if (tokenError) {
      doneCallback(tokenError);
    } else {
      var url = createGetFollowersUrl(userId, lastId);
      sendOAuthRequest(token, url, dataFoundCallback);
    }
  }
  
  if (!oauthToken) {
    // Try it out using the auth flow
    tokenManager.getToken({
      "followers": {
        "api" : "/followers/ids",
        "needed" : 4
      }
      }, 0, tokenReceivedFn);
  } else {
    // we were called with an existing token, just use that
    tokenReceivedFn(null, oauthToken)
  }
}





function getProfileInfo(oauthToken, userIdString, outDataArray, doneCallback) {
  var dataFoundCallback = function (tokenObj, error, response, body) {
    if (!error) {
      console.log("Received Successful response to get user profiles");
      var parsedData = JSON.parse(response);
      
      var columns = getUserHeaders();
      for(var i = 0; parsedData && parsedData.length && i < parsedData.length; i++) {
        var userProfile = parsedData[i];
        var rowData = {};
        for(var j=0; j<columns.length; j++) {
          var col = columns[j];
          var data = userProfile[col[0]];
          if (col[1] == "datetime" || col[1] == "date") {
            data = (new Date(data)).toISOString();
          }
          
          rowData[col[0]] = data;
        }
        
        outDataArray.push(rowData);
      }
      
      doneCallback();
    } else {
      console.log(error);
      doneCallback(error.toString());
    }
  };
  
  var url = "https://api.twitter.com/1.1/users/lookup.json?include_entities=false&user_id=" + userIdString; 
  var tokenReceivedFn = function(tokenError, token) {
    if (tokenError) {
      doneCallback(tokenError);
    } else {
      sendOAuthRequest(token, url, dataFoundCallback);
    }
  }
  
  if (!oauthToken) {
    // Try it out using the auth flow
    tokenManager.getToken({
      "users": {
        "api" : "/users/lookup",
        "needed" : 1
      }
      }, 0, tokenReceivedFn);
  } else {
    // we were called with an existing token, just use that
    tokenReceivedFn(null, oauthToken)
  }
}










router.get('/tableData', function(req, res) {
  var query = req.query.q;
  console.log("Query was " + query);

  var data = [];
  
  getData(undefined, query, undefined, getHeaders(), data, function(error) {
    if (error) {
      res.status(500);
      res.send(error);
    } else {
      res.send(data);
    }
  });
});

router.get('/followerIds', function(req, res) {
  var query = req.query.q;
  console.log("Query was " + query);
  
  var data = [];
  getFollowerIds(undefined, query, undefined, data, function(error) {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(data);
    }
  });
});

router.get('/userProfiles', function(req, res) {
  var query = req.query.q;
  console.log("/userProfiles query was " + query);
  
  var data = [];
  getProfileInfo(undefined, query, data, function(error) {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(data);
    }
  });
});

// Oath 1.0 stuff
var OAuth = require('oauth');
var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  clientId,
  appSecret,
  '1.0A',
  null,
  'HMAC-SHA1'
);

// callback signature is function(tokenObj, error, response, body)
function sendOAuthRequest(tokenObj, url, callback) {
  oauth.get(
    url,
    tokenObj.token,
    tokenObj.tokenSecret,
    function(error, response, body) {
      callback(tokenObj, error, response, body)
    });
}





function TokenQueue () {
    this.tokens = [];
    this.currentTokenIndex = 0;
    
    // Start off by putting my own access tokens in here
    var myToken = process.env.APPSETTING_Twitter_OAuthToken;
    var myTokenSecret = process.env.APPSETTING_Twitter_OAuthSecret;
    this.addToken(myToken, myTokenSecret);
}
 
TokenQueue.prototype.addToken = function(token, tokenSecret) {
  var newToken = {
    "token" : token,
    "tokenSecret" : tokenSecret
  };
  
  this.tokens.push(newToken);
  
  console.log("Adding token to the store! Current count is " + this.tokens.length);
  console.log("Token is " + JSON.stringify(newToken));
};

/*
Example resource group:
{
  "user" : {
    "api" : "/users/lookup",
    "needed" : 5
  }
}
*/
TokenQueue.prototype.getToken = function(resourceGroups, numAttempts, tokenFoundCallback) {
  numAttempts++;
  if (this.tokens.length == 0 || numAttempts > this.tokens.length) {
    tokenFoundCallback("Unable to find a token for your api", null);
    return;
  }
  
  this.currentTokenIndex = this.currentTokenIndex % this.tokens.length;
  var token = this.tokens[this.currentTokenIndex];
  var queryString = "";
  for(var key in resourceGroups) {
    queryString += key + ",";
  }
  
  queryString = queryString.substr(0, queryString.length - 1);
  var url = "https://api.twitter.com/1.1/application/rate_limit_status.json?resources=" + queryString;
  console.log("getToken url is " + url);
  var that = this;
  sendOAuthRequest(token, url, function(t, e, data, res) {
    if (e) {
      console.log("Received error getting status: " + e.toString());
      that.getToken(resourceGroups, numAttempts, tokenFoundCallback);
    } else {
      var succeeded = true;
      var rateData = JSON.parse(data).resources;
      for(var group in resourceGroups) {
        var needData = resourceGroups[group];
        var groupData = rateData[group];
        
        console.log("Group data: " + JSON.stringify(groupData));
        console.log("Need data: " + JSON.stringify(needData));
        
        var apiData = groupData[needData.api];
        var remainingQuota = apiData.remaining;
        var needQuota = needData.needed;
        
        if (remainingQuota < needQuota) {
          succeeded = false;
          break;
        }
      }
      
      console.log("Getting token succeeded = " + succeeded.toString());
      if (succeeded) {
        tokenFoundCallback(null, token);
      } else {
        that.getToken(resourceGroups, numAttempts, tokenFoundCallback);
      }
    }
  });
  
  this.currentTokenIndex++;
}

var tokenManager = new TokenQueue();

var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;

passport.use(new Strategy({
    consumerKey: clientId,
    consumerSecret: appSecret,
    callbackURL: 'http://webdataconnector.azurewebsites.net/Connectors/Twitter/auth/login/return'
  },
  function(token, tokenSecret, profile, cb) {
    // In this example, the user's Twitter profile is supplied as the user
    // record.  In a production-quality application, the Twitter profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    profile.token = token;
    profile.tokenSecret = tokenSecret;
    
    // Save the tokens off to my token queue
    tokenManager.addToken(token, tokenSecret);
    
    return cb(null, profile);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
router.use(require('morgan')('combined'));
router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));
router.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
router.use(passport.initialize());
router.use(passport.session());

router.get('/auth/',
  function(req, res) {
    res.render('twitter_home', { });
  });

router.get('/auth/login/',
  passport.authenticate('twitter'));

router.get('/auth/login/return', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/Connectors/Twitter/');
  });
  


module.exports = router;