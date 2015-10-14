$(document).ready(function() {
	$("#getDataButton").click(function() {
		var searchText = $("#searchInput").val();
		console.log("Search text is " + searchText);
		if (searchText.length > 0) {
			tableau.connectionData = searchText;
			tableau.connectionName = "Twitter Search: " + searchText;
			tableau.submit();
		}
	})
});

// WDC specific stuff
var myConnector = tableau.makeConnector();

myConnector.init = function() {
	tableau.initCallback();
}

myConnector.getColumnHeaders = function() {
	$.getJSON("./headers", function(data) {
		var fieldNames = [];
		var fieldTypes = [];
		
		for(var i=0; i<data.length; i++) {
			fieldNames.push(data[i][0]);
			fieldTypes.push(data[i][1]);
		}
		
		tableau.headersCallback(fieldNames, fieldTypes);
	});
};

myConnector.getTableData = function(lastRecordToken) {
	var queryString = tableau.connectionData;
	var url = './tableData?q=' + encodeURI(queryString);
	
	console.log("Query string is '" + queryString + "'");
	console.log("url is '" + url + "'");
	
	$.getJSON(url, function(data) {
		tableau.dataCallback(data, "", false);
	});
};

tableau.registerConnector(myConnector);

