var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var routes = require('./routes/index');
var users = require('./routes/users');
var config = require('./config.json');

var Firebase = require('firebase');
var ref = new Firebase("https://market-making.firebaseio.com/");

var Roll = require('roll');
var roll = new Roll();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  if(err){
    res.render("404");
  }
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// generate server token
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(config.secretKey);
var token = tokenGenerator.createToken({uid: "myServer", isServer: true});

ref.authWithCustomToken(token, function (err, authData) { // authenticate server
  if (err) {
    console.log("Login failed!", err);
  } else {
    console.log("Login succeeded!", authData);
  }
});

// GLOBAL EVENT HANDLER

var users = ref.child("users");
var members = ref.child("members");
var events = ref.child("events");
var rooms = ref.child("rooms");
var activeTrades = ref.child("activeTrades");
var tradeHistory = ref.child("tradeHistory");

events.on("value", function (snapshot) {
  snapshot.forEach(function (child) {
    var key = child.key();
    var val = child.val();

    if (val.type === "joinRoom") {
      if (val.roomID && val.userID) {
        rooms.child(val.roomID).child("startTime").once("value", function (snapshot) {
          // can only join if game hasn't started yet
          if (!snapshot.exists()) {
            members.child(val.roomID).child(val.userID).set(true, function () {
              // add to user's playing list
              users.child(val.userID).child("playing").child(val.roomID).set(true);
            });
          }
        });
      }
    } else if (val.type === "leaveRoom") { // UNUSED FOR THIS HACAKTHON
      if (val.roomID && val.userID) {
        room.child(val.roomID).child("startTime").once("value", function (snapshot) {
          // can only leave if game hasn't started yet
          if (!snapshot.exists()) {
            members.child(val.roomID).child(val.userID).remove(function () {
              // delete from user's playing list
              users.child(val.userID).child("playing").child(val.roomID).remove();
            });
          }
        });
      }
    } else if (val.type === "destroyRoom") { // UNUSED FOR THIS HACKATHON
      if (val.roomID && val.userID) {
        // check if room exists, then delete
        rooms.child(val.roomID).once("value", function (snapshot) {
          var data = snapshot.val();
          if (snapshot.exists() && data.host === val.userID) {
            rooms.child(val.roomID).remove();
            // then delete from host's hosting list
            users.child(val.userID).child("hosting").child(val.roomID).remove(function () {
              // then delete from all user's playing list
              members.child(val.roomID).once("value", function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                  var member = childSnapshot.key();
                  users.child(member).child("playing").child(val.roomID)
                });
                // then delete from members
                members.child(val.roomID).remove();
              });
            });
          }
        });
      }
    } else if (val.type === "makeOffer") {
      if (val.buyPrice && val.sellPrice && val.roomID && val.userID) {
        // check if user is in room
        members.child(val.roomID).child(val.userID).once("value", function (userSnap) {
          if (userSnap.exists()) {
            // push to activeTrades
            activeTrades.child(val.roomID).push({
              buyPrice: val.buyPrice,
              sellPrice: val.sellPrice,
              initiator: val.userID
            });
          }
        })
      }
    } else if (val.type === "acceptOffer") {
      if (val.offerID && val.roomID && val.userID && (val.buyOrSell === "buy" || val.buyOrSell === "sell")) {
        // check if user is in room
        members.child(val.roomID).child(val.userID).once("value", function (userSnap) {
          if (userSnap.exists()) {
            // check if offerID is still valid
            activeTrades.child(val.roomID).child(val.offerID).once("value", function (offerSnap) {
              if (offerSnap.exists()) {
                // process offer for both parties
                var initiator = offerSnap.val().initiator;
                // prevent a person from buying off of himself
                if (initiator !== val.userID) {
                  activeTrades.child(val.roomID).child(val.offerID).remove();
                  if (val.buyOrSell === "buy") { // acceptor chooses to buy, initiator sells
                    var initRef = tradeHistory.child(val.roomID).child(initiator).child("sells");
                    var userRef = tradeHistory.child(val.roomID).child(val.userID).child("buys");
                    var price = offerSnap.val().sellPrice;
                    console.log(initiator + " sells to " + val.userID + " for price " + price);
                    initRef.push({
                      partner: val.userID,
                      price: price
                    }, function () {
                      userRef.push({
                        partner: initiator,
                        price: price
                      });
                    });
                  } else { // acceptor chooses to sell, initiator buys
                    var initRef = tradeHistory.child(val.roomID).child(initiator).child("buys");
                    var userRef = tradeHistory.child(val.roomID).child(val.userID).child("sells");
                    var price = offerSnap.val().buyPrice;
                    console.log(initiator + " buys from " + val.userID + " for price " + price);
                    initRef.push({
                      partner: val.userID,
                      price: price
                    }, function () {
                      userRef.push({
                        partner: initiator,
                        price: price
                      });
                    });
                  }
                } else {
                  console.log("Can't buy from yourself");
                }
              } else {
                console.log("Offer doesn't exist anymore");
              }
            });
          } else {
            console.log("User is not a member of the room");
          }
        });
      }
    } else if (val.type === "addUser") {
      if (val.username && val.avatarURL && val.userID) {
        users.child(val.userID).once("value", function (snapshot) {
          if (!snapshot.exists()) {
            users.child(val.userID).set({
              name: val.username,
              avatarURL: val.avatarURL
            });
          }
        });
      }
    } else if (val.type === "startGame") {
      if (val.userID && val.roomID) {
        members.child(val.roomID).once("value", function (memSnapshot) {
          var numMembers = Object.keys(memSnapshot.val()).length;
          rooms.child(val.roomID).once("value", function (roomSnap) {
            var minPlayers = roomSnap.val().minPlayers;
            var host = roomSnap.val().host;
            // check if there are enough players and host is triggering event
            if (numMembers >= minPlayers && host === val.userID) {
              rooms.child(val.roomID).child("startTime").set(Date.now(), function () {
                rooms.child(val.roomID).once("value", function (snapshot) {
                  var data = snapshot.val();
                  var roundLength = data.roundLength;
                  var numRounds = data.numRounds;
                  console.log("Starting game with rollDice");
                  // NOTE: BE CAREFUL IF THIS PROGRAM RUNS ON MULTIPLE SERVERS!!
                  diceFunc(val.roomID, roundLength, numRounds, 0);
                });
              });
            }
          });
        });
      }
    } else if (val.type === "rollDice") {
      if (val.roomID && val.roundLength && val.numRounds && val.secret === config.secretKey) {
        console.log("Deprecated rollDice");
        // diceFunc(val.roomID, val.roundLength, val.numRounds, 0);
      }
    } else if (val.type === "endGame") {
      if (val.roomID && val.secret === config.secretKey) {
        // save tradeHistory
        tradeHistory.child(val.roomID).once("value", function (snapshot) {
          var data = snapshot.val();
          console.log("Writing trade history for room " + val.roomID);
          var outFile = "data/" + val.roomID + ".json";
          if (!data) data = {};
          fs.writeFile(outFile, JSON.stringify(data, null, 4), function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("JSON written to " + outFile);
            }
            // then get rid of everything
            rooms.child(val.roomID).remove(function () {
              members.child(val.roomID).remove(function () {
                activeTrades.child(val.roomID).remove(function () {
                  tradeHistory.child(val.roomID).remove();
                });
              });
            });
          });
        });
      }
    }

    // delete event
    events.child(key).remove();
  });
});

function diceFunc(roomID, roundLength, numRounds, counter) {
  var num = roll.roll('d6');
  console.log("Rolled a " + num.result);

  rooms.child(roomID).child("diceRolls").push(num.result, function () {
    console.log("Push successful: " + num.result);
  });

  counter += 1;
  // purge active trades after each dice roll
  activeTrades.child(roomID).remove();

  if (counter < numRounds) {
    setTimeout(diceFunc, roundLength * 1000, roomID, roundLength, numRounds, counter);
  } else {
    setTimeout(function () {
      events.push({
        type: "endGame",
        roomID: roomID,
        secret: config.secretKey
      });
    }, roundLength * 1000);
  }
}

module.exports = app;
