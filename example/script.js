(function() {

var SonnyPages = {};
    SonnyPages.public = [
        'public/login.html',
        'public/register.html',
        'public/header.html',
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
        // Everything is synchronous here
        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/login.html");

        var storage = new SONNY.StorageManager(instance);

		/*
		 * This is a test to demonstrate how global storage keys work
		 * Every key created here will be visible in each other sonny window
		 * Every window listens for modifications of this key and updates itself if required
		 */
        var VolumeTemplate = {
            name: "Volume",
            data: "0.80" + Math.floor(Math.random() * 1e2 + 1)
        };

        if (storage.keyExists(VolumeTemplate.name)) {
            storage.updateKey(VolumeTemplate);
        } else {
            storage.createKey(VolumeTemplate);
        }

        storage.onupdate( function(data) {
            console.log(instance.GLOBALKEYS, "Opened windows: " + storage.countWindows());
        });

    });

})();