var ref = new Firebase("https://market-making.firebaseio.com/");

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});

function FBLogin() {
	ref.authWithOAuthPopup("facebook", function(error, authData) {
		loginWithAuthData(authData);
	});
}

function loginWithAuthData(authData) {
	username = authData.facebook.displayName;
	avatarURL = authData.facebook.cachedUserProfile.picture.data.url;
	userID = authData.facebook.id;
	ref.child("users").child(userID).once("value", function (snapshot) {
		if (!snapshot.exists()) { // only add user if it doesn't exist
			ref.child("events").push({
				type: "addUser",
				username: username,
				avatarURL: avatarURL,
				userID: userID
			}, function () {
				removeLogin();
			});
		} else {
			removeLogin();
		}
	})
	

}

function attemptLogin() {
	var user = ref.getAuth();
	if (user) {
		loginWithAuthData(user);
	}
}

function removeLogin() {
	var authData = ref.getAuth();
	var login_btn = document.getElementById('login-btn');
	if (authData && login_btn) {
		document.getElementById("login-btn").innerHTML = "";
		document.getElementById("login-af").innerHTML = "Welcome, "+ username +"<br> <br>";
	}
	userIDForm();
}

function userIDForm() {
	var authData = ref.getAuth();
	var userForm = document.getElementById('userID');
	if (authData && userForm) {
		document.getElementById("userID").value = authData.facebook.id;
	}
	hideStartButton();
}

function hideStartButton() {
	var authData = ref.getAuth();
	if (authData) {
		var href = window.location.href;
		var roomID = href.substr(href.lastIndexOf("/") + 1).split("#")[0];
		if (roomID.length === 8) {
			ref.child("rooms").child(roomID).child("host").once("value", function (snapshot) {
				if (authData.facebook.id !== snapshot.val()) {
					$("#startGameButton").remove();
				}
			});
		}
		
	}
}

$(document).ready(function () {
	// attempt login first
	attemptLogin();
	anythingElse();
	removeLogin();
});

function anythingElse() {
	var roomSrc = $('#rooms').html(); // indicator for rooms
	var gameSrc = $('#game-area').html(); // indicator for waiting list
	var tradeSrc = $('#trade-area').html(); // indicator for trading game
	var time = $('#time').html();
	if(time){
		function startTimer(duration, display) {
    	var start = Date.now(),
        diff,
        seconds;
      
    	function timer() {
        // get the number of seconds that have elapsed since 
        // startTimer() was called
        diff = duration - (((Date.now() - start) / 1000) | 0);

        // does the same job as parseInt truncates the float
        
        seconds = (diff % 60) | 0;

        seconds = seconds < 10 ? "0" + seconds : seconds;

        // display.textContent = seconds; 

	        if (diff <= 0) {
	            // add one second so that the count down starts at the full duration
	            // example 05:00 not 04:59
	            start = Date.now() + 200;
	        }
		    };
		    // we don't want to wait a full second before the timer starts
		    timer();
			    setInterval(timer, 200);
			}
			
			window.onload = function () {
			    var fiveMinutes = 60,
			        display = document.querySelector('#time');
			    startTimer(fiveMinutes, display);
			};
		}
	if (roomSrc) {
		// initialize handlebars variables
		var roomTemplate = Handlebars.compile(roomSrc);
		ref.child("rooms").orderByChild("roomStarted").on("value", function (snapshot) {
			context = {rooms: snapshot.val(), userID: userID};
			var renderedRoomTemplate = roomTemplate(context);
			$("#rooms-view").html(renderedRoomTemplate);
			// inject userID into hidden inputs
			$(".userID").each(function (key, val) {
				val.value = userID;
			});
			// transform userIDs to names
			ref.child("users").once("value", function (usersSnapshot) {
				var data = usersSnapshot.val();
				$(".host").each(function (key, val) {
					val.innerHTML = data[val.innerHTML].name;
				});
				// count number of players
				ref.child("members").once("value", function (membersSnapshot) {
					var memData = membersSnapshot.val();
					$(".count").each(function (key, val) {
						if (memData[val.innerHTML]) {
							val.innerHTML = Object.keys(memData[val.innerHTML]).length;
						} else {
							val.innerHTML = 0;
						}
					});
				});
				
			});
		});
	}
	if (gameSrc) {
		// initialize handlebars variables
		var gameTemplate = Handlebars.compile(gameSrc);
		// get room ID from URL
		var href = window.location.href;
		var roomID = href.substr(href.lastIndexOf("/") + 1).split("#")[0];
		ref.child("members").child(roomID).on("value", function (snapshot) {
			var context = {members: snapshot.val(), roomID: roomID};
			var renderedTemplate = gameTemplate(context);
			$("#game-view").html(renderedTemplate);
			// transform userIDs to names
			ref.child("users").once("value", function (usersSnapshot) {
				var data = usersSnapshot.val();
				$(".users").each(function (key, val) {
					val.innerHTML = data[val.innerHTML].name;
				});
				// transform roomID into room name
				ref.child("rooms").child(roomID).once("value", function (roomSnapshot) {
					$("#roomName").html(roomSnapshot.val().roomName);
				});
			});
		});
	}
	if (tradeSrc) {
		// initialize handlebars variables
		var template = Handlebars.compile(tradeSrc);
		var href = window.location.href;
		var roomID = href.substr(href.lastIndexOf("/") + 1).split("#")[0].split("?")[0];
		// setup listeners
		ref.child("activeTrades").child(roomID).on("value", function (snapshot) {
			var context = {activeTrades: snapshot.val(), roomID: roomID};
			var renderedTemplate = template(context);
			$("#trade-container").html(renderedTemplate);
			console.log("Setting up listeners");
			setupListeners();
			// transform roomID into room name
			ref.child("rooms").child(roomID).once("value", function (roomSnapshot) {
				$("#roomName").html(roomSnapshot.val().roomName);
			});
		});
	}
}

function startGame() {
	var href = window.location.href;
	var roomID = href.substr(href.lastIndexOf("/") + 1).split("#")[0];
	ref.child("events").push({
		type: "startGame",
		userID: userID,
		roomID: roomID
	}, function () {
		location.reload();
	});
}

function setupListeners() {
	$("#trade").click(function () {
		var buyPrice = $("#buyPrice").val();
		var sellPrice = $("#sellPrice").val();
		var roomID = $("#roomID").val();
		console.log("Trying price " + buyPrice + " and " + sellPrice);
		if (buyPrice <= sellPrice - 2) { // maintain 2-point spread
			console.log("Has good spred");
			ref.child("events").push({
				type: "makeOffer",
				buyPrice: buyPrice,
				sellPrice: sellPrice,
				roomID: roomID,
				userID: userID
			});
		}
	});
}