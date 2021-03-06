var express = require('express');
var router = express.Router();

var fs = require('fs');
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
router.get('/game',function (req, res, next){
	res.render('games', {title: 'Games'});
});
router.get('/result',function(req, res, next){
	res.render('results', {title: 'Result'});
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

router.get('/results/:resultid', function (req, res, next) {
	console.log("Fetching results for " + req.params.resultid);
	var resultID = req.params.resultid;
	var filename = "./data/" + resultID + ".json";
	console.log("Should be located at " + filename);
	fs.readFile(filename, function (err, data) {
		if (err) throw err;
		var j = JSON.parse(data);
		var finalPrice = j.finalPrice;
		var ret = {};
		for (var user in j.trades) {
			var position = Object.keys(j.trades.buys).length - Object.keys(j.trades.sells);
			var cash = 0;
			for (var transaction in j.trades.buys) {
				cash -= parseInt(j.trades.buys[transaction].price);
			}
			for (var transaction in j.trades.sells) {
				cash += parseInt(j.trades.sells[transaction].price);
			}
			// penalties applied for not having zero position
			if (position > 0) {
				cash += (position * (finalPrice - 2));
			} else if (position < 0) {
				cash += (position * (finalPrice + 2));
			}
			ret[user] = cash;
		}
		res.render('results', {title: "Results", data: ret});
	});
});

router.get('/contact', function (req, res, next){
	res.render('contact', {title: 'Contact'});
});

module.exports = router;