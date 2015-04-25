var express = require('express');
var router = express.Router();

var shortid = require('shortid');
var Firebase = require('firebase');
var ref = new Firebase("https://market-making.firebaseio.com/");

/* GET home page. */
router.get('/', function (req, res, next) {
	console.log('jkasdf');
	res.render('index', { title: 'Market Making'});
});

router.get('/rooms', function (req, res, next) {
	res.render('rooms', {title: 'Rooms'});
});

router.post('/rooms', function (req, res, next) {
	console.log('POST /rooms works!');
	var roomName = req.body.name;
	var roomType = req.body.type;
	var numRounds = req.body.numrounds;
	var roundLength = req.body.roundlength;
	var minPlayers = req.body.minplayers;
	var userID = req.body.userID;
	if (roomName && roomType && numRounds && roundLength && minPlayers && userID) { // check validity
		var newID = shortid.generate();
		ref.child("rooms").child(newID).set({
			roomName: roomName,
			roomType: roomType,
			numRounds: numRounds,
			roundLength: roundLength,
			minPlayers: minPlayers,
			host: userID
		}, function () {
			// add to user's hosting list
			ref.child("users").child(userID).child("hosting").child(newID).set(true, function () {
				res.redirect("/rooms/" + newID);
			});
		});
	} else { // invalid POST
		res.redirect("/rooms");
	}
});

router.get('/rooms/:roomid', function (req, res, next) {
	console.log("Rendering game. Room ID: " + req.params.roomid);
	res.render('game', {title: 'Game', roomid: req.params.roomid});

});
router.get('/contact', function (req, res, next){
	res.render('contact', {title: 'Contact'});

});

module.exports = router;
