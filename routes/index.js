var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var connectors = [
    {
      name:'Facebook',
      url:'./Connectors/Facebook'
    },
    {
      name:'Square',
      url:'./Connectors/Square'
    },
  ];
  
  res.render('index', { title: "WebDataConnector.com", connectorList: connectors });
});

module.exports = router;
