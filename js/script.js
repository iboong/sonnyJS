(function() {
    var instance = new SONNY.Instance(function() {
        var renderer = new SONNY.Renderer(instance);
            renderer.render("index.html");
            renderer.render("navbar.html");
    });
})();
