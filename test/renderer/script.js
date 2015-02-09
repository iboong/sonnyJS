(function() {

	// Change global sonny page var
	SONNY.PAGEPATH = "../../templates/";

    var SonnyPages = [
        'public/login.html',
        'public/register.html',
        'public/footer.html',
        'public/gallery.html',
        'public/navigation.html'
    ];

    SonnyPages.Settings = {
        connection: false,
        connectionPort: 9005,
        displaynotifications: false
    }

    var instance = new SONNY.Instance(SonnyPages, function() {

        var renderer = new SONNY.Renderer(instance);

			/* 
			 * Everything is synchronous here
			 * Render pages and directly execute a function after it
			 */
			renderer.render("public/login.html");

			/*
			 * Select something from public/login.html
			 * Change the background color of the header
			 */
			document.querySelector("#header").style.background = "royalblue";

    });

})();