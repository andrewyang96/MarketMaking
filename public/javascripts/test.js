var ref = new Firebase("https://market-making.firebaseio.com");
var events = ref.child("events");

$(document).ready(function () {
	var randNum = Math.floor(Math.random() * 6) + 1;
	events.push({
		randNum: randNum,
		timestamp: Firebase.ServerValue.TIMESTAMP
	});
});