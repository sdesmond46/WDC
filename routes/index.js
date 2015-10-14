var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var connectors = [
    {
      name:'Facebook',
      url:'./Connectors/Facebook/'
    },
    {
      name:'Square',
      url:'./Connectors/Square/'
    },
    {
      name:'Stock Quotes',
      url:'http://sdesmond46.github.io/WDC_Test/WebDataConnector/WebDataConnector_sdk/StockQuoteConnector_advanced.html'
    },
    {
      name:'Mad Money Scraper',
      url:'http://sdesmond46.github.io/WDC_Test/WebDataConnector/WebDataConnector_sdk/Examples/MadMoneyScraper.html'
    },
    {
      name:'Twitter Search',
      url:'./Connectors/Twitter/'
    }
  ];
  
  res.render('index', { title: "WebDataConnector.com", connectorList: connectors });
});

module.exports = router;
