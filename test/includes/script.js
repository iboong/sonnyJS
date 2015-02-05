(function() {

var SonnyPages = {};
    SonnyPages.public = [
        'public/index.html',
		'public/navigation.html',
		'public/header.html',
		'public/footer.html',
		'public/ghostcontent.html',
		'public/realcontent.html'
    ];

    SonnyPages.Settings = {
        pagecontainer: "syContainer"
    }

    var instance = new SONNY.Instance(SonnyPages, function() {
        // Everything is synchronous here!
        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/index.html");
    });

})();