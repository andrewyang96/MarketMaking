var express = require('express');
var router = express.Router();
var bootstrap = require('boostrap')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Market Making' });
});

module.exports = router;
