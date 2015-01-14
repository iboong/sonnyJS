function initialize() {

var FullScreenButton = document.querySelector(".fullscreenToggle");
if (FullScreenButton) {
	FullScreenButton.addEventListener('click', function() {
		FullScreenButton.src = SONNY.toggleFullScreen() ? "assets/img/exitfullscreen.png" : "assets/img/gofullscreen.png";
	});
} else throw ("Can't find element!");
	// SONNY.render("public/login.html");
}

window.addEventListener('DOMContentLoaded', initialize);