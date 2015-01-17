/**
 * sonnyJS v0.1.1
 * www.github.com/felixmaier/sonnyJS
 * @author Felix Maier
 */
 
/* TODO: RECODE */
(function() {

var root = this;

var SONNY = SONNY || {};

SONNY = {
    Version: "0.1.1",
    Functions: {},
    CurrentPage: null,
	LastPages: [],
    Loaded: false,
	Initialized: false,
    Width: null,
    Height: null,
    Mobile: false,
	Fullscreen: false,
	saidHello: false,
	Pages: {},
    PagePath: "view/",
	LoadFileType: ".html",
	HomePage: "public/login.html",
	ShowVersion: false,
	Server: true,
	Port: 9005,
	PageContainer: "syContainer",
	
	// SONNY version
    printVersion: function() {
		if (!SONNY.ShowVersion) return;
        var SonnyVersion = document.createElement("div");
			SonnyVersion.style.position = 'absolute';
			SonnyVersion.style.right = '5px';
			SonnyVersion.style.bottom = '0px';
			SonnyVersion.innerHTML = "Version: " + SONNY.Version;

        document.body.appendChild(SonnyVersion);
    },
	
	// Console message
	sayHello: function() {
		if (SONNY.saidHello) return;
		if ( navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ) {
			var args = [
				'%c sonny.js ' + SONNY.Version + ' ->%c http://www.sonnyjs.io/ ',
				'color: #d9d9d9; background: #000',
				'background: #000'
			];
			console.log.apply(console, args);
		}
	},
	
	// Create the main page container
	createPageContainer: function() {
		document.body.appendChild(document.createElement(SONNY.PageContainer));
	},
	
	// Mobile device detection
	isMobile: function() {
        if (navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)) {
            return true;
        } else {
            return false;
        }
    },
	
	// Handle a window resize
    resize: function() {
        window.onresize = function() {
            SONNY.Width = window.innerWidth;
            SONNY.Height = window.innerHeight;
            // Iphone fix
            window.scrollTo(0, 0);
        };
    },

	pushLastPage: function(page) {
		if (SONNY.LastPages.length >= 10) {
			SONNY.LastPages.shift();
		}
		SONNY.LastPages.push(page);
	},

	// Preload all pages
    preloadPages: function(data, resolve) {
	
		if (data) SONNY.Pages = data;
		else throw ("Please define the pages sonny has to preload!");

        var PageObject = {};

        var loadedFiles = [];

        function hasLoaded(data) {
            if (!(data instanceof Object)) {
                loadedFiles.push(data);
            }
        }

		// Load pages through xhr
        function load(data, index) {
            Object.keys(data).forEach(function(key) {
                if (!(data[key] instanceof Object)) {
                    hasLoaded(data[key]);
                }
                if (data[key] instanceof Object) {
                    if (SONNY.Pages[key]) {
                        PageObject[key] = {};
                        load(data[key], key);
                    }
                } else {
                    if (PageObject[index]) {
                        SONNY.GET(SONNY.PagePath + data[key] + SONNY.antiCache(), function(resp) {
							
							var htmlToDOM = document.implementation.createHTMLDocument("html");
								htmlToDOM.documentElement.innerHTML = resp;
								htmlToDOM = [SONNY.compileHTML(htmlToDOM.body.children[0])];

							var compiledHTML = htmlToDOM[0];
								compiledHTML.Content = htmlToDOM[0].inside;
								
								delete compiledHTML.inside;
							
                            PageObject[index][data[key]] = compiledHTML;
                            loadedFiles.shift();
                            if (!loadedFiles.length) {
                                init(PageObject);
                            }
                        });
                    }
                }
            });
        }

        function init(object) {
            SONNY.Pages = object;
            SONNY.Loaded = true;
			resolve();
			// Delayed to beautify it
			setTimeout(function() {
				SONNY.preloadAnimation.hide();
				setTimeout(function() {
					SONNY.render(SONNY.HomePage);
				}, 250);
			}, 1550);
            
        }

        load(data);
    },
	
	// TODO: SONNY.loadPage({ }); Add a single page and resolve after successfull load
	
	// Fullscreen code snippet by mdn
	toggleFullScreen: function() {
	    if (!document.fullscreenElement &&
	        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
	        if (document.documentElement.requestFullscreen) {
	            document.documentElement.requestFullscreen();
	        } else if (document.documentElement.msRequestFullscreen) {
	            document.documentElement.msRequestFullscreen();
	        } else if (document.documentElement.mozRequestFullScreen) {
	            document.documentElement.mozRequestFullScreen();
	        } else if (document.documentElement.webkitRequestFullscreen) {
	            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	        }
			SONNY.Fullscreen = true;
	    } else {
	        if (document.exitFullscreen) {
	            document.exitFullscreen();
	        } else if (document.msExitFullscreen) {
	            document.msExitFullscreen();
	        } else if (document.mozCancelFullScreen) {
	            document.mozCancelFullScreen();
	        } else if (document.webkitExitFullscreen) {
	            document.webkitExitFullscreen();
	        }
			SONNY.Fullscreen = false;
	    }
		return SONNY.Fullscreen;
	},
	
	// Render page from core object
    render: function(data) {

        SONNY.CurrentPage = data;
		
		SONNY.pushLastPage(data);

        data = data.match("/") ? data.split("/") : data;

        var page, main;

        function getPage(value, index) {
            if (SONNY.Pages[value]) {
                getPage(SONNY.Pages[value], value);
            } else {
                var url = "";
                if (value && index) {
                    Object.keys(data).forEach(function(key) {
                        if (!data[key].match(SONNY.LoadFileType)) {
                            url += data[key] + "/";
                            if (SONNY.Pages[data[key]]) {
                                page = SONNY.Pages[data[key]];
                            }
                        } else {
                            url += data[key];
                            main = url;
							if (!(page[main])) throw (": Page "+main+" does not exist!");
                            renderPage(page[main]);
                        }
                    });
                }
            }
        }

        Object.keys(data).forEach(function(key) {
            getPage(data[key]);
        });
		
		function renderPage(data) {

			if (Boolean(data["sy-requireserver"])) {
				searchForServerData(data, function(response) {
					createHTML(response);
				});
			} else {
				createHTML(data);
			}

			function createHTML(data) {
				
				var content = throwData(data.Content);

				var body = document.querySelector(SONNY.PageContainer);

				// Clean
				body.innerHTML = "";

				createContainer(content, body);

				function createContainer(data, target) {
					Object.keys(data).forEach( function(key) {
						target.appendChild(data[key]);
					});
				}
			}
			
			function throwData(data) {
				var elementsArray = [];
				if (data instanceof Object) {
					Object.keys(data).forEach( function(key) {
						elementsArray.push(SONNY.compileJSON(data[key])[0]);
					});
				}
				return elementsArray;
			}
		}

		function searchForServerData(data, resolve) {

			var loadedData = 0;

			var object = data.Content[0];

			resolveChildren(object, function(result) {
				data.Content[0] = result;
				resolve(data);
			});

			// Asynchonous recursion
			function goDeep(data, resolve) {
				if (data instanceof Object) {
					// Backup found
					if (data.backup) {
						data = data.backup;
						delete data.backup;
					}
					Object.keys(data).forEach(function(key) {
						if (!(data[key] instanceof Object)) {
							if (data[key].match("%(.*)%")) {
								if (!(data.backup)) {
									var original = SONNY.Functions.clone(data);
									// Hold it fresh
									if (original.inside) {
										delete original.inside;
									}
									data.backup = original;
								}

								loadedData++;

								SONNY.GETServerValue(data[key], "getUserData", function(result) {
									data[key] = result;
									loadedData--;
									resolve(data);
								});
							}
						} else {
							goDeep(data[key], function(output) {
								data[key] = output;
								if (loadedData <= 0) {
									resolve(data);
								}
							});
						}
					});
				}
			}

			function scanServerText(data, resolve) {
				goDeep(data, function() {
					resolve(data);
				});
			}

			function resolveChildren(parent, resolve) {
				[parent].map(function(data) {
					scanServerText(data, function() {
						resolve(data);
					});
				});
			}
		}

    },
	
	// Prevent browser from caching
	antiCache: function() {
        return "?" + (new Date()).getTime();
    },
	
	// Deferred xhr request
	GET: function(url, resolve) {
	    var request = new XMLHttpRequest();

		request.open("GET", url, true);
	    request.onload = onload;
	    request.send();
		
		function onload() {
	        if (request.status === 200) {
	            resolve(request.responseText);
	        } else {
	           throw ("Status code was " + request.status);
	        }
	    }
	},
	
	// Compile JSON to HTML
    compileJSON: function(data) {
        var element,
            elementsArray = [];
			
        Object.keys(data).forEach(function(ii) {
            if (ii === "key") {
                element = document.createElement(data.key);
            } else if (ii === "text") {
				element.innerHTML = data.text;
			} else {
				if (ii === "inside") {
					if (data.inside instanceof Object) {
						for (var key = 0; key < data.inside.length; ++key) {
							var insideElements = SONNY.compileJSON(data.inside[key]);
							element.appendChild(insideElements[0]);
						}
					}
				} else {
					try {
						// Don't render backups
						if (ii !== "backup") element.setAttribute(ii, data[ii]);
					}
					catch (e) {
					   throw ("JSON rendering failed: " + e);
					}
				}
			}

        });

		element = SONNY.Functions.specialAttributes(element);

        elementsArray.push(element);

        return elementsArray;

    },
	
	// Compile HTML to JSON
	compileHTML: function(object) {
		var jsonobj = {};
			jsonobj.key = object.tagName.toLowerCase();
        if (object.hasAttribute) {
            for (i = 0; i < object.attributes.length; i++) {
                jsonobj[object.attributes[i].name] = object.attributes[i].value;
            }
        }
        if (object.hasChildNodes()) {
            var child = object.firstChild;
            if (child.nodeType === 3 && child.data.trim() !== '') {
                jsonobj.text = child.data;
            }

            if ((child.nodeType === 3 && child.nextSibling) || child.nodeType === 1) {
                jsonobj.inside = [];
            }

            while (child) {
                if (child.nodeType === 1 && child.nodeName !== 'SCRIPT') {
                    jsonobj.inside.push(SONNY.compileHTML(child));
                }
                child = child.nextSibling;
            }
        }

        return jsonobj;
	}
};

SONNY.GETServerValue = function(data, message, resolve) {

	// Fetch data from server
	function getServerData(data, message, resolve) {
		socket.emit('message', SONNY.Functions.stringifyMsg([message, data]), function(responseData) {
			resolve(responseData);
		});
	}
	
	if (data.match("%(.*)%")) {
		
		// User data expression
		var rXuserData = new RegExp(/%([-|\d|\w]+)%/g);
		
		// Global data expression
		var rXglobalData = new RegExp(/$([-|\d|\w]+)$/g);

		var myValue,
			output = [],
			replace = [];

		while ((myValue = rXuserData.exec(data)) !== null)  {  
			output.push(myValue[1]);
			replace.push(myValue[0]);
		}

		if (output && output.length) {
			Object.keys(output).forEach( function(ii) {
				getServerData(output[ii], message, function(result) {
					data = data.replace(replace[0], result);
					replace.shift();
					if (!replace.length) {
						resolve(data);
					}
				});
			});
		} else {
			resolve(data);
		}
	} else throw("Not supported yet!");
}

SONNY.init = function(data, resolve) {
	SONNY.preloadAnimation.new();
	SONNY.createPageContainer();
	SONNY.Width = window.innerWidth;
	SONNY.Height = window.innerHeight;
	SONNY.Mobile = SONNY.isMobile();
	SONNY.resize();
	SONNY.printVersion();
	SONNY.sayHello();
	SONNY.loadRessources( function() {
		if (SONNY.Server) {
			SONNY.Connection.init(function() {
				if (!SONNY.Initialized) {
					if (data) {
						initialize(data, function() {
							resolve();
						});
					} else throw ("Sonny got no pages to load!");
				}
			});
		} else {
			initialize(data, function() {
				resolve();
			});
		}
	});
	
	function initialize(data, resolve) {
		SONNY.preloadPages(data, function() {
			SONNY.pages = data;
			SONNY.Initialized = true;
			resolve();
		});
	}
};

SONNY.loadRessources = function(resolve) {
	var script = document.createElement("script");
		script.src = 'app/lib/notifications.js';
		script.addEventListener("load", function() {
			resolve();
		});
	document.head.appendChild(script);
};

SONNY.Connection = {

	socket: null,

	connected: false,

	// Will get increased
	reconnectTimer: 500,

	init: function(resolve) {

		socket = io.connect(window.location.host + ':' + SONNY.Port + '/');

		socket.on('connect', function () {
			SONNY.Connection.connected = true;
			SONNY.Connection.reconnectTimer = 500;
			resolve();
		});

		// Deal with data received from the server
        socket.on('message', function(event) {
            var data = event;
				try {
					data = JSON.parse("[" + data + "]");
				} catch (error) {
					console.log("%cReceived a message of an incorrect form from the server:", "color : hsl(0, 100%, 40%)", data, error);
					return;
				}

			// Server instructs to load a page
			if (data[0][0] == "loadPage") {
				SONNY.render(data[0][1]);
			}

			// Server instructs to alert something
			if (data[0][0] == "alert") {
				new NotificationFx({
					message : data[0][1]
				}).show();
			}

			// Log all received data
			//console.info(data);
        });

		// When the connection closes
        socket.on('disconnect', function() {
			SONNY.Connection.connected = false;
			SONNY.Connection.reconnectTimer = SONNY.Connection.reconnectTimer * 2;

				new NotificationFx({
					message : "Trying to reconnect in " + parseFloat(SONNY.Connection.reconnectTimer / 1000) + " seconds",
				}).show();
			
			setTimeout( function() {
				SONNY.Connection.Reconnect();
			}, SONNY.Connection.reconnectTimer);
		});

	},

	// Needs to be rewritten & rethinked
	Reconnect: function() {
		socket.connect();
		socket.io.reconnect();
	}

};

SONNY.preloadAnimation = {
	
	new: function() {
		this.show();
	},
	
	show: function() {
		var fullscreenElement = document.createElement("div");
			fullscreenElement.className = "loader";
			
		for (var ii = 0; ii < 4; ++ii) {
			var el = document.createElement("span");
				fullscreenElement.appendChild(el);
		}
	
		document.body.appendChild(fullscreenElement);
	},
	
	hide: function() {
		var Elements = document.querySelectorAll(".loader");
		for (var ii = 0; ii < Elements.length; ++ii) {
			if (Elements[ii] instanceof Element) {
				Elements[ii].parentNode.removeChild(Elements[ii]);
			}
		}
	}

};

SONNY.customListener = function(value) {
	if (value.match(":")) {
		return value.split(":");
	} else {
		var newValue = [];
			newValue[0] = "click";
			newValue[1] = value;
		return newValue;
	}
};

SONNY.minMaxAttribute = function(data) {
	var minMax = data.split(",");
		
	for (var ii = 0; ii < minMax.length; ++ii) {
		minMax[ii] = parseInt(minMax[ii]);
	}
	
	if (minMax.length <= 1 || minMax.length > 2) throw ("sy-min-max requires 2 comma seperated integer values!");
	else return minMax;
	
};

// Hurry up, we're dreaming
SONNY.Functions = {
	
	// Check for special sonny attributes
	specialAttributes: function(element) {
		if (!element) throw ("Received invalid element");
		// Min Max length property
		if (element.attributes["sy-min-max"]) {
			var minMax = SONNY.minMaxAttribute(element.attributes["sy-min-max"].value);
			element.addEventListener('keypress', function(event) {
				if (event.srcElement.value.length >= minMax[1]) {
					if (event.keyCode !== 8) event.preventDefault();
				}
			});
		}
		// Load a page
		if (element.attributes["sy-load"]) {
			var loadAttribute = SONNY.customListener(element.attributes["sy-load"].value);
			element.addEventListener(loadAttribute[0], function() {
				SONNY.render(loadAttribute[1] + SONNY.LoadFileType);
			});
		}
		// Some action for the server
		if (element.attributes["sy-action"]) {
			var actionAttribute = SONNY.customListener(element.attributes["sy-action"].value);
			element.addEventListener(actionAttribute[0], function() {
				if (element.attributes["sy-action-values"]) SONNY.Functions.processAction(actionAttribute[1], element.attributes["sy-action-values"].value);
				else SONNY.Functions.processAction(actionAttribute[1]);
			});
		}
		// Preload images
		if (element.attributes["sy-image"]) {
			element.style.display = "none";
			var image = new Image();
				image.src = element.attributes["sy-image"].value;
				image.addEventListener("load", function() {
					element.src = element.attributes["sy-image"].value;
					element.style.display = "block";
				}, false);
		}
		return element;
	},
	
	// Handle the action and tell the server what to do
	processAction: function(action, values) {
        var resultArray = [],
            passedData = [];

        if (values && values.length) {
            resultArray = values.split(",");
			
			Object.keys(resultArray).forEach(function(key) {
				var element = document.querySelector("input[name=" + resultArray[key] + "]");
				
				if (!element.value || element.value === "") return;
				
				if (element.attributes["sy-min-max"]) {
					var minMax = SONNY.minMaxAttribute(element.attributes["sy-min-max"].value);
					
					if (element.value.length >= minMax[0]) {
						if (element.value.length <= minMax[1]) {
							passedData.push(element.value);
							if (passedData.length === resultArray.length) {
								if (passedData && passedData.length) {			
									socket.emit('message', SONNY.Functions.stringifyMsg(["userAction", action, passedData]), function(responseData){
										SONNY.render(responseData);
									});
								}
							}
						} else {
							new NotificationFx({message : "A maximum of "+minMax[1]+" characters are allowed!"}).show();
							element.focus();
						}
					} else {
						new NotificationFx({message : "At least "+minMax[0]+" characters are required!"}).show();
						element.focus();
					}
				}
			});
        } else {
			socket.emit('message', SONNY.Functions.stringifyMsg(["userAction", action]), function(responseData){
				SONNY.render(responseData);
			});
		}
	},
	
	/*
	 * Search document for specific string
     * HTML only!
	 */
    findAndReplace: function(regex, value) {

        deep(document.body, new RegExp(regex), value);

        function deep(node, target, replacement) {
            var child, text, newText;

            switch (node.nodeType) {
                case 1:
                    for (child = node.firstChild; child; child = child.nextSibling) {
                        deep(child, target, replacement);
                    }
                    break;

                case 3:
                    text = node.nodeValue;
                    newText = text.replace(target, replacement);
                    if (text != newText) {
                        node.nodeValue = newText;
                    }
                    break;
            }
        }
    },
	
	// Clone object node
	clone: function(x) {
		if(x === null || typeof x !== 'object') {
			return x;
		}
	 
		if(Array.isArray(x)) {
			return cloneArray(x);
		}
		
		function cloneArray (x) {
			var l = x.length;
			var y = new Array(l);
			for (var i = 0; i < l; ++i) {
				y[i] = SONNY.Functions.clone(x[i]);
			}
			return y;
		}
		
		function cloneObject (x) {
			var keys = Object.keys(x);
			var y = {};
			for (var k, i = 0, l = keys.length; i < l; ++i) {
				k = keys[i];
				y[k] = SONNY.Functions.clone(x[k]);
			}
		 
			return y;
		}
	 
		return cloneObject(x);
	},
	
	// To json
	stringifyMsg: function(data) {
		return JSON.stringify(data).slice(1, -1);	
	}

};	

	if (window.SONNY) throw ("Another instance of sonnyJS is already loaded!");

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = SONNY;
        }
        exports.SONNY = SONNY;
    } else if (typeof define !== 'undefined' && define.amd) {
        define(SONNY);
    } else {
        root.SONNY = SONNY;
    }

}).call(this);