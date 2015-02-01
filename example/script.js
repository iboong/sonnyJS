(function() {

var SonnyPages = {};
    // Pages for guests
    SonnyPages.public = [
        'public/login.html',
        'public/register.html',
        'public/github.html',
        'public/github2.html',
        'public/github3.html'
    ];
    // Pages for logged in users
    SonnyPages.private = [
        'private/home.html',
        'private/settings.html'
    ];

    // Define settings here
    SonnyPages.Settings = {
        //startpage: "public/register.html",
        pagecontainer: "syContainer",
        online: false
    }

    var instance = new SONNY.Instance(SonnyPages, function() {
        // Do anything you want here
        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/login.html");
    });

})();