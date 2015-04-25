var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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
//app.use(favicon(__dirname + '/public/favicon.ico'));
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
      }
    } else if (val.type === "acceptOffer") {
      if (val.offerID && val.roomID && val.userID) {
        // check if offer is still valid and if user in room
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
        rooms.child(val.roomID).child("startTime").set(Date.now(), function () {
          rooms.child(val.roomID).once("value", function (snapshot) {
            var data = snapshot.val();
            var roundLength = data.roundLength;
            var numRounds = data.numRounds;
            events.push({
              type: "rollDice",
              roomID: roomID,
              roundLength: roundLength,
              numRounds: numRounds,
              secret: config.secretKey
            });
          })
        });
      }
    } else if (val.type === "rollDice") {
      if (val.roomID && val.roundLength && val.numRounds && val.secret === config.secretKey) {
        var num = roll.roll('d6');
        console.log("Rolled a " + num);
        rooms.child(val.roomID).child("diceRolls").push(num, function () {
          rooms.child(val.roomID).child("diceRolls").once("value", function (snapshot) {
            var count = Object.key(snapshot.val()).length;
            // check if there's at least one more round left
            if (count < val.numRounds) {
              setTimeout(function () {
                events.push({
                  type: "rollDice",
                  roomID: val.roomID,
                  roundLength: val.roundLength,
                  numRounds: val.numRounds,
                  secret: config.secretKey
                })
              }, val.roundLength * 1000);
            } else { // else terminate game at the next timeout
              setTimeout(function () {
                events.push({
                  type: "endGame",
                  roomID: val.roomID,
                  secret: config.secretKey
                });
              }, val.roundLength * 1000);
            }
          });
        });
      }
    } else if (val.type === "endGame") {
      if (val.roomID && val.secret === config.secretKey) {
        // the presence of a "finished" key means that the game is finished
        rooms.child(val.roomID).child("finished").set(true);
      }
    }

    // delete event
    events.child(key).remove();
  });
});


module.exports = app;
