var Core = {
    version: "0.1.0",
    functions: {},
    pages: {},
    currentPage: null,
    loaded: false,
    width: null,
    height: null,
    mobile: false,
	fullscreen: false
}

// Hurry up, we're dreaming
Core.functions = {

	// Core version
    version: function() {
		if (!Settings.showVersion) return;
        var elVersion = document.createElement("div");
			elVersion.style.position = 'absolute';
			elVersion.style.right = '5px';
			elVersion.style.bottom = '0px';
			elVersion.innerHTML = "Version: " + Core.version;

        document.body.appendChild(elVersion);
    },
	
	// Console message
	sayHello: function() {
		if ( navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ) {
			var args = [
				'%c sonny.js ' + Core.version + ' ->%c http://www.sonnyjs.io/ ',
				'color: #d9d9d9; background: #000',
				'background: #000'
			];
			console.log.apply(console, args);
		}
	},

	// Just for debugging..
    showFPS: function() {
        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        document.body.appendChild(stats.domElement);

        var update = function() {
            stats.begin();
            stats.end();
            requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    },

    // Handle a window resize
    resize: function() {
        window.onresize = function() {
            Core.width = window.innerWidth;
            Core.height = window.innerHeight;
            // Iphone fix
            window.scrollTo(0, 0);
        }
    },
	
	// Create the page container
	createPageElement: function() {
		var el = document.createElement('pageContent');
			if (Settings.body.match("#")) el.id = Settings.body.replace("#", "").trim();
			else el.id = Settings.body;
		document.body.appendChild(el);
	},

    // Initialize the awesomeness
    init: function() {
		Core.functions.createPageElement();
        Core.pages = Settings.Pages;
        Core.width = window.innerWidth;
        Core.height = window.innerHeight;
        Core.mobile = this.detectMobileDevice();
        Core.functions.preloadPages(Core.pages);
        Core.functions.resize();
        Core.functions.version();
		Core.functions.sayHello();
		Core.functions.fullscreenButton();
    },

    // Preload all pages from the config.js
    preloadPages: function(data) {

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
                    if (Settings.Pages[key]) {
                        PageObject[key] = {};
                        load(data[key], key);
                    }
                } else {
                    if (PageObject[index]) {
                        Core.functions.AJAX(Settings.PagePath + data[key] + Core.functions.antiCache()).then(function(resp) {
							
							var htmlToDOM = document.implementation.createHTMLDocument("html");
								htmlToDOM.documentElement.innerHTML = resp;
								htmlToDOM = [Core.functions.compileHTML(htmlToDOM.body.children[0])];

							var compiledHTML = htmlToDOM[0];
								compiledHTML.Content = htmlToDOM[0].inside;
								
								delete compiledHTML.inside;
							
                            PageObject[index][data[key]] = compiledHTML;
                            loadedFiles.shift();
                            if (!loadedFiles.length) {
                                init(PageObject);
                            }
                        })
                    }
                }
            });
        }

        function init(object) {
            Core.pages = object;
            Core.loaded = true;
			// Delayed to beautify it
			setTimeout(function() {
				if (Settings.Server) Connection.init();
				preloadAnimation.hide();
				setTimeout(function() {
					Core.functions.renderPage(Settings.startPage);
				}, 250);
			}, 850);
            
        }

        load(data);
    },

	// Render page from core object
    renderPage: function(data) {

        Core.currentPage = data;

        var data = data.split("/");

        var page, main;

        var serverData = [];

        function getPage(value, index) {
            if (Core.pages[value]) {
                getPage(Core.pages[value], value);
            } else {
                var url = "";
                if (value && index) {
                    Object.keys(data).forEach(function(key) {
                        if (!data[key].match(Settings.loadFileType)) {
                            url += data[key] + "/";
                            if (Core.pages[data[key]]) {
                                page = Core.pages[data[key]];
                            }
                        } else {
                            url += data[key];
                            main = url;
							if (!(page[main])) throw (": Page "+main+" does not exist! Please check your configuration file!");
                            Core.functions.render(page[main]);
                        }
                    });
                }
            }
        }

        Object.keys(data).forEach(function(key) {
            getPage(data[key]);
        });

    },

    render: function(data) {
	
        if (Boolean(data["sy-requireserver"])) {
            Core.functions.searchForServerData(data).then(function(response) {
                createHTML(response);
            });
        } else {
            createHTML(data);
        }

        function createHTML(data) {
			
            var content = throwData(data.Content);

            var body = document.querySelector(Settings.body);

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
					elementsArray.push(Core.functions.compileJSON(data[key])[0]);
				});
			}
			return elementsArray;
		}
    },

    searchForServerData: function(data) {

        var loadedData = 0;

        var deferred = Q.defer();

        var object = data.Content[0];
		
		// Fetch user data from server expression
		var rXuserData = new RegExp(/%([-|\d|\w]+)%/g);

        [object].map(function(key) {
            resolveChildren(key).then(function(result) {
                data.Content[0] = result;
                deferred.resolve(data);
            });
        });

		// TODO: Does not work properly on specific nodes yet
        function textmatch(data) {
            var deferred = Q.defer();
            var matching = false;

			var myValue,
				output = [],
				replace = [];

			while ((myValue = rXuserData.exec(data)) != null)  {  
				output.push(myValue[1]);
				replace.push(myValue[0]);
			}

            if (output && output.length > 0) {
				Object.keys(output).forEach( function(ii) {
					getServerData(output[ii]).then(function(result) {
						data = data.replace(replace[0], result);
						replace.shift();
						if (!replace.length) {
							deferred.resolve(data);
						}
					});
				});
            } else {
                deferred.resolve(data);
            }
            return deferred.promise;
        }

		// Fetch data from server
        function getServerData(data) {
            var deferred = Q.defer();
            socket.emit('message', Core.functions.stringifyMsg(["getUserData", data]), function(responseData) {
				deferred.resolve(responseData);
            });
            return deferred.promise;
        }

		// Asynchonous deferred recursion
        function goDeep(data) {
            var deferred = Q.defer();
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
								var original = Core.functions.clone(data);
								// Hold it fresh
								if (original.inside) {
									delete original.inside;
								}
								data.backup = original;
							}

                            loadedData++;

                            textmatch(data[key]).then(function(result) {
                                data[key] = result;
                                loadedData--;
                                deferred.resolve(data);
                            });
                        }
                    } else {
                        goDeep(data[key]).then(function(output) {
                            data[key] = output;
                            if (loadedData <= 0) {
                                deferred.resolve(data);
                            }
                        });
                    }
                });
            }
            return deferred.promise;
        }

        function scanServerText(data) {
            var deferred = Q.defer();
            goDeep(data).then(function(result) {
                deferred.resolve(data);
            });
            return deferred.promise;
        }

        function resolveChildren(parent) {
            var deferred = Q.defer();
            var result = Q.all([parent].map(function(data) {
                scanServerText(data).then(function() {
                    deferred.resolve(data);
                });
            }));
            return deferred.promise;
        }

        return deferred.promise;
    },

	// Compile JSON to HTML
    compileJSON: function(data) {
        var element,
            elementsArray = [];

        Object.keys(data).forEach(function(ii) {
            if (ii === "key") {
                element = document.createElement(data["key"]);
            } else if (ii === "class") {
				element.className = data["class"];
			} else if (ii === "text") {
				element.innerHTML = data["text"];
			} else {
				if (ii === "inside") {
					if (data.inside instanceof Object) {
						Object.keys(data.inside).forEach(function(key) {
							var insideElements = Core.functions.compileJSON(data.inside[key]);
							element.appendChild(insideElements[0]);
						});
					}
				} else {
					try {
						// Don't render backups
						if (!(ii === "backup")) element.setAttribute(ii, data[ii]);
					}
					catch (e) {
					   throw ("JSON rendering failed: " + e);
					}
				}
			}

        });

		element = Core.functions.specialAttributes(element);

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
            if (child.nodeType === 3 && child.data.trim() != '') {
                jsonobj.text = child.data;
            }

            if ((child.nodeType === 3 && child.nextSibling) || child.nodeType === 1) {
                jsonobj.inside = [];
            }

            while (child) {
                if (child.nodeType === 1 && child.nodeName != 'SCRIPT') {
                    jsonobj.inside.push(Core.functions.compileHTML(child));
                }
                child = child.nextSibling;
            }
        }

        return jsonobj;
	},
	
	// Check for special sonny attributes
	specialAttributes: function(element) {
		if (!element) throw ("Received invalid element");
		// Min Max length property
		if (element.attributes["sy-min-max"]) {
			var minMax = element.attributes["sy-min-max"].value;
				minMax = minMax.split(",");
				for (ii in minMax) {
					minMax[ii] = parseInt(minMax[ii]);
				}
			element.addEventListener('keypress', function(event) {
				if (event.srcElement.value.length >= minMax[1]) {
					if (event.keyCode !== 8) event.preventDefault();
				}
			});
		}
		// Load a page
		if (element.attributes["sy-load"]) {
			var loadAttr = element.attributes["sy-load"].value;
			if (loadAttr.match(":")) {
				loadAttr = loadAttr.split(":");
				element.addEventListener(loadAttr[0], function() {
					Core.functions.renderPage(loadAttr[1] + Settings.loadFileType);
				});
			} else {
				element.addEventListener('click', function() {
					Core.functions.renderPage(element.attributes["sy-load"].value + Settings.loadFileType);
				});
			}
		}
		// Some action for the server
		if (element.attributes["sy-action"]) {
			element.addEventListener("click", function() {
				if (element.attributes["sy-action-values"]) Core.functions.processAction(element.attributes["sy-action"].value, element.attributes["sy-action-values"].value);
				else Core.functions.processAction(element.attributes["sy-action"].value);
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
				
				if (element.attributes["sy-min-max"]) {
					var minMax = element.attributes["sy-min-max"].value;
						minMax = minMax.split(",");
						for (ii in minMax) {
							minMax[ii] = parseInt(minMax[ii]);
						}
						
					if (minMax.length <= 1) throw ("sy-min-max requires 2 comma seperated integer values!");
	
					if (element.value && element.value !== "") {
						if (element.value.length >= minMax[0]) {
							if (element.value.length <= minMax[1]) {
								passedData.push(element.value);
								if (passedData.length === resultArray.length) {
									if (passedData && passedData.length) {			
										socket.emit('message', Core.functions.stringifyMsg(["userAction", action, passedData]), function(responseData){
											Core.functions.renderPage(responseData);
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
				}
			});
        } else {
			socket.emit('message', Core.functions.stringifyMsg(["userAction", action]), function(responseData){
				Core.functions.renderPage(responseData);
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
		if(x == null || typeof x !== 'object') {
			return x;
		}
	 
		if(Array.isArray(x)) {
			return cloneArray(x);
		}
		
		function cloneArray (x) {
			var l = x.length;
			var y = new Array(l);
			for (var i = 0; i < l; ++i) {
				y[i] = Core.functions.clone(x[i]);
			}
			return y;
		}
		
		function cloneObject (x) {
			var keys = Object.keys(x);
			var y = {};
			for (var k, i = 0, l = keys.length; i < l; ++i) {
				k = keys[i];
				y[k] = Core.functions.clone(x[k]);
			}
		 
			return y;
		}
	 
		return cloneObject(x);
	},
	
	// Mobile device detection
	detectMobileDevice: function() {
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
	
	// To json
	stringifyMsg: function(data) {
		return JSON.stringify(data).slice(1, -1);	
	},
	
	// Prevent browser from caching
	antiCache: function() {
        var data = (new Date()).getTime();
        return "?"+data;
    },
	
	// Deferred xhr request
	AJAX: function(url) {
	    var request = new XMLHttpRequest();
	    var deferred = Q.defer();
 
		request.open("GET", url, true);
	    request.onload = onload;
	    request.onerror = onerror;
	    request.onprogress = onprogress;
	    request.send();

	    function onload() {
	        if (request.status === 200) {
	            deferred.resolve(request.responseText);
	        } else {
	            deferred.reject(new Error("Status code was " + request.status));
	        }
	    }

	    function onerror() {
	        deferred.reject(new Error("Can't XHR " + JSON.stringify(url)));
	    }

	    function onprogress(event) {
	        deferred.notify(event.loaded / event.total);
	    }

	    return deferred.promise;
	},
	
	fullscreenButton: function() {
		if (Settings.fullscreenButton) {
			var fullscreenButton = document.querySelector(".fullscreenToggle");
			fullscreenButton.addEventListener('click', function() {
				Core.functions.toggleFullScreen(function(bool) {
					fullscreenButton.src = bool ? "assets/img/exitfullscreen.png" : "assets/img/gofullscreen.png";
				});
			});
		}
	},
	
	// Fullscreen code snippet by mdn
	toggleFullScreen: function(fn) {
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
			Core.fullscreen = true;
			fn(true);
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
			Core.fullscreen = false;
			fn(false);
	    }
	}

	}