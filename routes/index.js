var express = require('express');
var router = express.Router();
var bootstrap = require('boostrap')
/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Market Making' });
});

router.get('/rooms', function (req, res, next) {
	res.render('rooms', {title: 'Rooms'});
});

router.get('/rooms/:roomid', function (req, res, next) {
	res.render('game', {title: 'Game'});
});

module.exports = router;
