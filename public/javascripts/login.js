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
	var rooms = document.getElementById('rooms'); // indicator for rooms
	if (rooms) {
		ref.child("rooms").orderByChild("roomStarted").on("value", function (snapshot) {
			var roomID = snapshot.key();
			var room = snapshot.val();
			// template stuff
		});
	}
}