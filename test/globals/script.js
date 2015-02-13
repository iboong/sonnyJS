(function() {

    // Change global sonny page var
    SONNY.PAGEPATH = "../../templates/";

    var instance = new SONNY.Instance(function() {

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