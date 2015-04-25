var ref = new Firebase("https://market-making.firebaseio.com/");

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
}

$(document).ready(function () {
	// attempt login first
	attemptLogin();
	anythingElse();
	removeLogin();
});

function anythingElse() {
	var rooms = $('#rooms'); // indicator for rooms
	if (rooms) {
		// initialize handlebars variables
		var roomSrc = rooms.html();
		var roomTemplate = Handlebars.compile(roomSrc);
		ref.child("rooms").orderByChild("roomStarted").on("value", function (snapshot) {
			context = {rooms: snapshot.val()};
			var renderedRoomTemplate = roomTemplate(context);
			$("#rooms-view").html(renderedRoomTemplate);
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
}