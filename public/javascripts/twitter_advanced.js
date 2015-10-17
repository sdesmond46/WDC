$(document).ready(function() {
	var getSearchText = function() {
		var searchText = $("#searchInput").val();
		if (searchText.indexOf("@") == 0) {
			searchText = searchText.substring(1);
		}
		
		console.log("Search text is " + searchText);
		return searchText;
	}
	
	var makeConnData = function(handle, queryType) {
		var res = {
			"q" : handle,
			"type" : queryType
		};
		
		return JSON.stringify(res);
	}
	
	$("#getDataButton").click(function() {
		var searchText = getSearchText();
		
		if (searchText.length > 0) {
			tableau.connectionData = makeConnData(searchText, "tweets");
			tableau.connectionName = "@" + searchText + "'s Tweets";
			tableau.submit();
		}
	});
	
	$("#getFollowersButton").click(function() {
		var searchText = getSearchText();
		
		if (searchText.length > 0) {
			tableau.connectionData = makeConnData(searchText, "followers");
			tableau.connectionName = "@" + searchText + "'s Followers";
			tableau.submit();
		}
	});
});

// WDC specific stuff
var myConnector = tableau.makeConnector();

myConnector.init = function() {
	tableau.initCallback();
}

myConnector.getColumnHeaders = function() {
	var connData = JSON.parse(tableau.connectionData);
	
	$.getJSON("./headers?queryType=" + connData.type, function(data) {
		var fieldNames = [];
		var fieldTypes = [];
		
		for(var i=0; i<data.length; i++) {
			fieldNames.push(data[i][0]);
			fieldTypes.push(data[i][1]);
		}
		
		tableau.headersCallback(fieldNames, fieldTypes);
	});
};

function doTweets(lastRecordToken) {
	var connData = JSON.parse(tableau.connectionData);
	var url = './tableData?q=' + encodeURI(connData.q);
	
	console.log("url is '" + url + "'");
	
	$.getJSON(url, function(data) {
		tableau.dataCallback(data, "", false);
	}).error( function(err) {
		 tableau.abortWithError(err);
	});
}

var userIds = [];
function doFollowers(lastRecordToken) {
	if (lastRecordToken) {
		var lastInt = parseInt(lastRecordToken);
		var nextInt = Math.min(lastInt + 100, userIds.length);
		var idArray = userIds.slice(lastInt, nextInt);
		var idString = idArray.join(",");
		console.log("id array is " + idString);
		var url = './userProfiles?q=' + idString;
		console.log("url is '" + url + "'");
		$.getJSON(url, function(data) {
			tableau.dataCallback(data, nextInt.toString(), nextInt < userIds.length);
		}).error( function(err) {
			tableau.abortWithError(err);
		});
		
	} else {
		var connData = JSON.parse(tableau.connectionData);
		var url = './followerIds?q=' + encodeURI(connData.q);
		
		console.log("url is '" + url + "'");
		
		$.getJSON(url, function(data) {
			// we got a huge list of twitter ids
			userIds = data;
			tableau.dataCallback([], "0", true);
		}).error( function(err) {
			tableau.abortWithError(err);
		});
	}
}

myConnector.getTableData = function(lastRecordToken) {
	var connData = JSON.parse(tableau.connectionData);
	if (connData.type == "tweets") {
		doTweets(lastRecordToken);
	} else {
		doFollowers(lastRecordToken);
	}
};

tableau.registerConnector(myConnector);

