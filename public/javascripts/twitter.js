
// WDC specific stuff
var myConnector = tableau.makeConnector();

myConnector.init = function() {
	tableau.initCallback();
}

myConnector.getColumnHeaders = function() {
	var fieldNames = []

var fieldTypes = [
];

  tableau.headersCallback(fieldNames, fieldTypes);
};

myConnector.getTableData = function(lastRecordToken) {
};

tableau.registerConnector(myConnector);