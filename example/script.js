(function() {

var SonnyPages = {};
    // Pages for guests
    SonnyPages.public = [
        'public/login.html',
        'public/register.html',
        'public/header.html',
        'public/footer.html',
		'public/gallery.html',
		'public/navigation.html'
    ];
    // Pages for logged in users
    SonnyPages.private = [
        'private/home.html',
        'private/settings.html'
    ];

    SonnyPages.Settings = {
        connection: true,
        connectionPort: 9005,
        displaynotifications: true
    }

    var instance = new SONNY.Instance(SonnyPages, function() {
        // Everything is synchronous here
        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/login.html");

    });

})();