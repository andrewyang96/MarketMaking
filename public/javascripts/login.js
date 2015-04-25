var ref = new Firebase("https://market-making.firebaseio.com/");

function loginWithAuthData(authData) {
	username = authData.facebook.displayName;
	avatarUrl = authData.facebook.cachedUserProfile.picture.data.url;
	renderTemplate();
}

function attemptLogin() {
	var user = ref.getAuth();
	if (user) {
		loginWithAuthData(user);
	}
}

function renderTemplate() {
	// TODO
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