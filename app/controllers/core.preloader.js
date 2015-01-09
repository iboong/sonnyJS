var preloadAnimation = {
	
	new: function() {
		this.show();
	},
	
	show: function() {
		var fullscreenElement = document.createElement("div");
			fullscreenElement.className = "heartbeat center";
	
		document.body.appendChild(fullscreenElement);
	},
	
	hide: function() {
		var Elements = document.querySelectorAll(".heartbeat");
		for (ii in Elements) {
			if (Elements[ii] instanceof Element) {
				Elements[ii].parentNode.removeChild(Elements[ii]);
			}
		}
	},

};

preloadAnimation.new();