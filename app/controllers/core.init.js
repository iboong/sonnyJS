var ressources = [
	'app/controllers/core.preloader.js',
	'app/config.js',
	'app/lib/socket.io-1.2.1.js',
	'app/lib/q.js',
	'app/controllers/core.connection.js',
	'app/controllers/core.notifications.js',
    'app/controllers/core.js'
];
var loadScript = function() {
    if (ressources.length) {
        script = document.createElement("script");
		script.addEventListener("load", function() {
            loadScript();
        });
        script.src = ressources.shift();
        document.head.appendChild(script);
    } else {
		// Ready
		Core.functions.init();
	}
};
window.addEventListener("DOMContentLoaded", loadScript);