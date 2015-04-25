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
		renderTemplate();
	});

}

function attemptLogin() {
	var user = ref.getAuth();
	if (user) {
		loginWithAuthData(user);
	}
}

function renderTemplate(req, res, next) {
	res.render("index", {userID: userID});// TODO
}

$(document).ready(function () {
	// attempt login first
	attemptLogin();
	renderTemplate();
	anythingElse();
});

function anythingElse() {
	// TODO
}