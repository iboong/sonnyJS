(function() {

    SONNY.PAGEPATH = "../templates/";

    var Sonny = [
        'public/login.html',
        'public/register.html',
        'public/footer.html',
        'public/gallery.html',
        'public/navigation.html'
    ];

    Sonny.Settings = {
        connection: false,
        connectionPort: 9005,
        displaynotifications: false
    }

    Sonny.Variables = {
		FIRST_WEBSITE: "My first Website!"
    }

    var instance = new SONNY.Instance(Sonny, function() {

        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/login.html");

        console.log(instance);

    });

})();