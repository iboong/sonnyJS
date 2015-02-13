(function() {

    SONNY.PAGEPATH = "../../templates/";

	SONNY.CONFIGPATH = "./config.json";

    var instance = new SONNY.Instance(function() {

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

        /*
         * Another window got opened and changed the value
         * Second param prints the amount of active windows
         */
        storage.onupdate( function(data) {
            console.log(instance.GLOBALKEYS, "Opened windows: " + storage.countWindows());
        });

    });

})();