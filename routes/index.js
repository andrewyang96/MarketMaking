var express = require('express');
var router = express.Router();

var shortid = require('shortid');
var Firebase = require('firebase');
var ref = new Firebase("https://market-making.firebaseio.com/");

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Market Making'});
});

router.get('/rooms', function (req, res, next) {
	res.render('rooms', {title: 'Rooms'});
});

router.post('/rooms', function (req, res, next) {
	var roomName = req.body.name;
	var roomType = req.body.type;
	var numRounds = req.body.numrounds;
	var roundLength = req.body.roundlength;
	var minPlayers = req.body.minplayers;
	var userID = req.body.userID;
	var roomID = req.body.roomID;
	if (roomName && roomType && numRounds && roundLength && minPlayers && userID) { // check validity for creating new room
		console.log("Creating new room");
		var newID = shortid.generate();
		ref.child("rooms").child(newID).set({
			roomName: roomName,
			roomType: roomType,
			numRounds: numRounds,
			roundLength: roundLength,
			minPlayers: minPlayers,
			host: userID,
			roomStarted: Date.now()
		}, function () {
			// add to user's hosting list
			ref.child("users").child(userID).child("hosting").child(newID).set(true, function () {
				// add to user's playing list
				ref.child("users").child(userID).child("playing").child(newID).set(true, function () {
					// add to members
					ref.child("members").child(newID).child(userID).set(true, function () {
						res.redirect("/rooms/" + newID);
					});
				});
			});
		});
	} else if (userID && roomID) { // check validity for joining a room
		console.log("Joining room " + roomID);
		ref.child("rooms").child(roomID).child("startTime").once("value", function (snapshot) {
			if (!snapshot.exists()) {
				ref.child("events").push({
					type: "joinRoom",
					userID: userID,
					roomID: roomID
				}, function () {
					res.redirect("/rooms/" + roomID);
				});
			} else { // game already started
				console.log("Game already started");
				res.redirect("/rooms");
			}
		})
		
	} else { // invalid POST
		console.log("Invalid POST in /room");
		res.redirect("/rooms");
	}
});

router.get('/rooms/:roomid', function (req, res, next) {
	console.log("Rendering game. Room ID: " + req.params.roomid);
	var roomID = req.params.roomid;
	ref.child("rooms").child(roomID).once("value", function (snapshot) {
		if (snapshot.exists()) {
			ref.child("rooms").child(roomID).child("startTime").once("value", function (startSnap) {
				if (startSnap.exists()) {
					res.render('games', {title: 'Game', roomid: roomID});
				} else {
					res.render('waiting', {title: 'Waiting', roomid: roomID});
				}
			});
		} else {
			res.render("404");
		}	
	});
});

router.get('/contact', function (req, res, next){
	res.render('contact', {title: 'Contact'});
});

module.exports = router;