var Connection = {

	socket: null,

	connected: false,

	// Will get increased
	reconnectTimer: 500,

	init: function() {

		socket = io.connect(window.location.host + ':9005/');

		socket.on('connect', function () {
			Connection.connected = true;
			Connection.reconnectTimer = 500;
		});

		// Deal with data received from the server
        socket.on('message', function(event) {
            var data = event;
				try {
					data = JSON.parse("[" + data + "]");
				} catch (error) {
					console.log("%cReceived a message of an incorrect form from the server:", "color : hsl(0, 100%, 40%)", data, error);
					return;
				};

			// Server instructs to load a page
			if (data[0][0] == "loadPage") {
				Core.functions.renderPage(data[0][1]);
			}

			// Server instructs to alert something
			if (data[0][0] == "alert") {
				var notification = new NotificationFx({
					message : data[0][1],
					layout : 'attached',
					effect : 'bouncyflip',
					type : 'notice'
				}).show();
			}

			// Log all received data
			//console.info(data);
        });

		// When the connection closes
        socket.on('disconnect', function() {
			Connection.connected = false;
			Connection.reconnectTimer = Connection.reconnectTimer * 2;

			var notification = new NotificationFx({
					message : "Trying to reconnect in " + parseFloat(Connection.reconnectTimer / 1000) + " seconds",
					layout : 'attached',
					effect : 'bouncyflip',
					type : 'notice'
				}).show();
			
			setTimeout( function() {
				Connection.Reconnect();
			}, Connection.reconnectTimer);
		});

	},

	// Needs to be rewritten & rethinked
	Reconnect: function() {
		socket.connect();
		socket.io.reconnect();
	},

};