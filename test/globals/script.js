(function() {

    // Change global sonny page var
    SONNY.PAGEPATH = "../../templates/";

    var SonnyPages = [
        'public/login.html',
        'public/register.html',
        'public/footer.html',
        'public/gallery.html',
        'public/navigation.html',
        'public/audio.html'
    ];

    SonnyPages.Settings = {
        connection: false,
        connectionPort: 9005,
        displaynotifications: false
    }

    var instance = new SONNY.Instance(SonnyPages, function() {

        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/login.html");

            /*
             * Render a global page
             * Will be static added and is visible on every page
             */
            renderer.render("public/audio.html");

            /*
             * Command to delete all global content
             */
            //renderer.kill("global");

    });

})();