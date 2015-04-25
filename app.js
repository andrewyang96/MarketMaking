var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var Firebase = require('firebase');
var ref = new Firebase("https://market-making.firebaseio.com/");

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
  next(err);
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

<<<<<<< HEAD
// event handler

=======
// GLOBAL EVENT HANDLER

var users = ref.child("users");
>>>>>>> origin/master
var members = ref.child("members");
var events = ref.child("events");

events.on("value", function (snapshot) {
  snapshot.forEach(function (child) {
    var key = child.key();
    var val = child.val();
<<<<<<< HEAD
    if (val["type"] === "joinRoom") {
      var roomId = val["roomId"];
      var userId = val["userId"];
      if (roomId && userId) {
        members.child(roomId).child(userId).set(true, function () {
          // add to user's playing
        });
      }
    } else if (val["type"] === "leaveRoom") {
      var roomId = val["roomId"];
      var userId = val["userId"];
      if (roomId && userId) {
        members.child(roomId).child(userId).set(null, function () {
          // delete from user's playing
        });
      }
    } else if (val["type"] === "destroyRoom") {
      //destroy room
    } else if (val["type"] === "makeOffer") {
      //make offer
    } else if (val["type"] === "acceptOffer") {
      // accept offer
    }



=======
    if (val.type === "joinRoom") {
      if (val.roomID && val.userID) {
        members.child(val.roomID).child(val.userID).set(true, function () {
          // add to user's playing list
          users.child(val.userID).child("playing").child(val.roomID).set(true);
        });
      }
    } else if (val.type === "leaveRoom") {
      if (val.roomID && val.userID) {
        members.child(val.roomID).child(val.userID).remove(function () {
          // delete from user's playing list
          users.child(val.userID).child("playing").child(val.roomID).remove();
        });
      }
    } else if (val.type === "destroyRoom") {
      if (val.roomID && val.userID) {
        // check if exists, then delete
      }
    } else if (val.type === "makeOffer") {
      //make offer
    } else if (val.type === "acceptOffer") {
      // accept offer
    } else if (val.type === "addUser") {
      console.log("adding user");
      if (val.username && val.avatarURL && val.userID) {
        users.child(val.userID).once("value", function (snapshot) {
          if (!snapshot.exists()) {
            console.log("creating user");
            users.child(val.userID).set({
              name: val.username,
              avatarURL: val.avatarURL
            });
          }
        });
      }
    }


/*
>>>>>>> origin/master
    console.log("New key: " + key);
    console.log("New value: " + val["randNum"]);
    console.log("Pushing to users");
    // push key-val pair to users
    ref.child("users").child(key).set(val, function () {
      // remove key-val pair from events
      console.log("Removing key-val pair");
      events.child(key).remove();
    });*/
  });
});


module.exports = app;
