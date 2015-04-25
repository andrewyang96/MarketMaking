var express = require('express');
var router = express.Router();
var bootstrap = require('bootstrap');
var shortid = require('shortid');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Market Making' });
});

router.get('/rooms', function (req, res, next) {
	res.render('rooms', {title: 'Rooms'});
});

router.get('/room/create', function (req, res, next) {
	// other settings
	var newID = shortid.generate();
	res.render('newroom', {title: 'Create New Room', newID: newID});
})

router.get('/rooms/:roomid', function (req, res, next) {
	res.render('game', {title: 'Game', roomid: res.params.roomid});
});

module.exports = router;
