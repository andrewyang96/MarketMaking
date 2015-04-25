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
	ref.child("events").push({
		type: "addUser",
		username: username,
		avatarURL: avatarURL,
		userID: userID
	}, function () {
		removelogin();
	});

}

function attemptLogin() {
	var user = ref.getAuth();
	if (user) {
		loginWithAuthData(user);
	}
}

function removelogin() {
	var authData=ref.getAuth();
	var login_btn = document.getElementById('login-btn');
	if (authData && login_btn) {
		document.getElementById("login-btn").innerHTML = "";
		document.getElementById("login-af").innerHTML = "Welcome, "+ username;
	}
	
}

$(document).ready(function () {
	// attempt login first
	attemptLogin();
	removelogin();
	anythingElse();
});

function anythingElse() {
	// TODO
}