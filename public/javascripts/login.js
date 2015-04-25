var ref = new Firebase("https://market-making.firebaseio.com/");

function loginWithAuthData(authData) {
	username = authData.facebook.displayName;
	avatarUrl = authData.facebook.cachedUserProfile.picture.data.url;
	renderTemplate();
}

// attempt login first
var user = root.getAuth();
if (user) {
	loginWithAuthData(user);
}