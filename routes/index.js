var express = require('express');
var router = express.Router();
<<<<<<< HEAD
=======
var bootstrap = require('bootstrap');
var shortid = require('shortid');

>>>>>>> origin/master
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
router.get('/contact', function (req, res, next){
	res.render('contact', {title: 'Contact'});
});

module.exports = router;
