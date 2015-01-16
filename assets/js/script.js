var SonnyPages = {};
	// Pages for guests
	SonnyPages.public = [
		'public/login.html',
		'public/register.html'
	];
	// Pages for logged in users
	SonnyPages.private = [
		'private/home.html',
		'private/settings.html'
	];


function initialize() {

var FullScreenButton = document.querySelector(".fullscreenToggle");
if (FullScreenButton) {
	FullScreenButton.addEventListener('click', function() {
		FullScreenButton.src = SONNY.toggleFullScreen() ? "assets/img/exitfullscreen.png" : "assets/img/gofullscreen.png";
	});
} else throw ("Can't find element!");

	SONNY.init(SonnyPages, function() {
		console.log(SONNY);
	});

}

window.addEventListener('DOMContentLoaded', initialize);