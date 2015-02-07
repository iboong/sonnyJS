/**
 * sonnyJS v0.1.0
 * www.github.com/felixmaier/sonnyJS
 * @author Felix Maier
 */

(function() { 'use strict'

    var root = this;

    /**
     * Shorten document.querySelector()
     */
    var $ = function() {
        return document.querySelector(arguments[0]);
    };

    /**
     * Static namespace-class for sonnyJS
     */
    var SONNY = SONNY || {};

    /**
     * Version of sonny
     */
    SONNY.VERSION = "0.1.0";

    /**
     * Default page path where sonny templates are stored
     */
    SONNY.PAGEPATH = "view/";

    /**
     * Filetype sonny has to process
     */
    SONNY.FILETYPE = ".html";

    /**
     * Check if browser history manipulation is avaible
     */
    SONNY.HISTORY = window.history ? true : false;

    /**
     * Save original host url
     */
    SONNY.ORIGINALHISTORY = window.location.href;

    /**
     * Counts initialized sonny instances
     */
    SONNY.INITIALIZED = 0;

    /**
     * Displays current sonny version in the console
     */
    SONNY.SHOWVERSION = false;

    /**
     * Manages all virtual pages
     * Get each unvirtualized page from the sonny instance
     * Get each page file and virtualize it
     * Callback after everything got loaded and stored successfully
     */
    SONNY.Virtualiser = function(resolve) {

        var self = this;

        if (!SONNY.LOADED) {
            this.init(this.VIRTUALPAGES, function(result) {
                self.PAGES = result;
                self.PAGES = self.interpreter.Includes(result);
                SONNY.LOADED = true;
                resolve();
                if (self.STARTPAGE) {
                    self.renderer.render(self.STARTPAGE);
                } else if (self.history && self.history.additionalURL.length) {
                    self.renderer.render(self.history.additionalURL + SONNY.FILETYPE);
                }
            });
        }

    };

    SONNY.Virtualiser.prototype.constructor = SONNY.Virtualiser;

    /**
     * Compile every page into an virtual page
     * @param data (object)
     */
    SONNY.Virtualiser.prototype.init = function(data, resolve) {

        var self = this;

        var page = {},
            loadedPages = 0;

        var _virtualise = function(data, index) {
            Object.keys(data).forEach(function(key) {
                if (!(data[key] instanceof Object)) {
                    ++loadedPages;
                }
                if (data[key] instanceof Object) {
                    if (self.VIRTUALPAGES[key]) {
                        page[key] = {};
                        _virtualise(data[key], key);
                    }
                } else {
                    if (page[index]) {
                        self.GET(SONNY.PAGEPATH + data[key], function(resp) {

                            if (page[index][data[key]]) 
                            throw new Error("Multiple definition of " + page[index][data[key]].path + "!");

                            var compiler = self.compiler;

                            var DOM = compiler.DOM(resp);

                            if (DOM.tagName !== 'APP') throw new Error('Missing "app" tag in ' + data[key] + '!');

                            var DOMOBJECT = compiler.HTML(DOM);
                                DOMOBJECT.content = DOMOBJECT.inside;
                                DOMOBJECT.path = data[key];

                            delete DOMOBJECT.inside;

                            page[index][data[key]] = new SONNY.Page(DOMOBJECT);

                            --loadedPages;
                            if (loadedPages <= 0) {
                                resolve(page);
                            }
                        });
                    }
                }
            });
        };
        _virtualise(this.VIRTUALPAGES);
    };

    /**
     * Add a page object to the pageInstances
     * @param: url (string) : public/home
     */
    SONNY.Virtualiser.prototype.GET = function(url, resolve) {
        var request = new SONNY.GET();
        request.onload = function() {
            if (this.status === 200) {
                resolve(this.responseText);
            } else {
                throw new Error("Status code was " + this.status);
            }
        };
        request.open('GET', url + "?" + (new Date()).getTime(), true);
        if (request.overrideMimeType) request.overrideMimeType('text/html');
        request.send(null);
    };

    /**
     * Represents a page object
     * @param name (string) name of the page
     * @param server (boolean) page requires server values
     * @param content (object) content of the page to render
     * @param includes (integer) counts amount of included external pages
     * @param ready (boolean) page is in an ready to be rendered state
     */
    SONNY.Page = function(page) {
        this.name = String(page["sy-sitename"]);
        this.path = String(page.path);
        this.requireServer = Boolean(page["sy-requireserver"]) || false;
        this.content = page.content;
        this.includes = 0;
        this.ready = true;
    };

    SONNY.Page.prototype.constructor = SONNY.Page;

    /**
     * Interprets sonny pages
     * @methods loops
     */
    SONNY.Interpreter = function() {

        if (arguments[0]) this.__instance = arguments[0];

    };

    SONNY.Interpreter.prototype.constructor = SONNY.Interpreter;


    /**
     * Finds include keys in objects
     * Replace include element with virtual sonny page content
     * @param object (object) sonny page object
     */
    SONNY.Interpreter.prototype.Includes = function(object) {

        var self = this;

        var pageObject = object;

        var _initialize = function(data) {
            for (var ii in data) {
                if (typeof data[ii] === 'object') {
                    _initialize(data[ii]);
                    if (data.content) { 
                        pageObject = data;
                        data.content = _inherit(data.content);
                    }
                }
            }
            return data;
        };

        var _inherit = function(object) {
            for (var ii in object) {
                if (typeof object[ii] === "object") {
                    object[ii] = _inherit(object[ii]);
                    if (object[ii].key && object[ii].key === "syinclude") {
                        pageObject.includes++;
                        var result = _inherit(self.__instance.renderer.get(object[ii].page + SONNY.FILETYPE)).content;
                        object.splice(ii, !false);
                        object.splice.apply(_inherit(object), [ii, 0].concat(result));
                    }
                }
            }
            return object;
        };

        return _initialize(pageObject);
    }

    /**
     * Compiler to virtualise html and render objects
     */
    SONNY.Compiler = function() {

        if (arguments[0]) this.__instance = arguments[0];

    };

    SONNY.Compiler.prototype.constructor = SONNY.Compiler;

    /**
     * Compile a html string into dom html
     * @param html (string)
     */
    SONNY.Compiler.prototype.DOM = function(html) {
        var HTMLDOM = document.implementation.createHTMLDocument("html");
            HTMLDOM.documentElement.innerHTML = html;
        return HTMLDOM.body.children[0];
    };

    /**
     * Compile html to an json object
     */
    SONNY.Compiler.prototype.HTML = function(object) {
        if (!object instanceof Object) throw new Error("Received arguments of invalid type");
        var virtualPage = {};
        virtualPage.key = object.tagName.toLowerCase();
        if (object.hasAttribute) {
            for (var ii = 0; ii < object.attributes.length; ii++) {
                virtualPage[object.attributes[ii].name] = object.attributes[ii].value;
            }
        }
        if (object.hasChildNodes()) {
            var child = object.firstChild;
            if (child.nodeType === 3 && child.data.trim() !== '') {
                virtualPage.text = child.data;
            }

            if ((child.nodeType === 3 && child.nextSibling) || child.nodeType === 1) {
                virtualPage.inside = [];
            }

            while (child) {
                if (child.nodeType === 1) {
                    virtualPage.inside.push(this.HTML(child));
                }
                child = child.nextSibling;
            }
        }
        return virtualPage;
    };

    /**
     * Compile json object into dom html
     */
    SONNY.Compiler.prototype.JSON = function(data, include) {

        var element,
            array = [];

        var self = this;

        var _compile = function(data) {

            if (data.key !== "syinclude") {
            for (var key in data) {
                
                if (key === "key") {
                    element = document.createElement(data.key);
                } else if (key === "text") {
                    element.innerHTML = data.text;
                } else {
                    if (key === "inside") {
                        if (data.inside) {
                            for (var ii = 0; ii < data.inside.length; ++ii) {
                                var insideElements = self.JSON(data.inside[ii]);
                                for (var ll in insideElements) {
                                    element.appendChild(insideElements[ll]);
                                }
                            }
                        }
                    } else {
                        try {
                            // Don't render backups
                            if (element && key !== "backup") element.setAttribute(key, data[key]);
                        } catch (e) {
                            throw new Error("JSON rendering failed: " + e);
                        }
                    }
                }
            }

            element = new SONNY.Vivifier(self.__instance).vivify(element);

            array.push(element);
            
            }

        };

        _compile(data);

        return array;
    };

    /**
     * Search for specific attributes in dom element
     * @param element (dom)
     */
    SONNY.Vivifier = function() {

        this.instance = arguments[0] || this;

    };

    SONNY.Vivifier.prototype.constructor = SONNY.Vivifier;

    /**
     * Search for specific attributes in dom element
     * @param element (dom)
     */
    SONNY.Vivifier.prototype.vivify = function(element) {

        var self = this;

        var LOAD = "sy-load";
        var MINMAX = "sy-min-max";
        var ACTION = "sy-action";
        var IMAGE = "sy-image";

        if (!element) throw new Error("Invalid element type!");

        if (element.attributes[LOAD]) {
            if (element.attributes[LOAD].value.match(":")) {
                element = this.addListeners(element, LOAD);
            } else {
                element.addEventListener('click', function() {
                    self.instance.render(element.attributes[LOAD].value + SONNY.FILETYPE);
                });
            }
        }
        return element;
    };

    /**
     * Add multiple event listeners to dom
     * @param element (dom)
     */
    SONNY.Vivifier.prototype.addListeners = function(element, type) {
        var self = this;
        var listeners = element.attributes[type].value.split(":");
        if (listeners[0].split("&").length >= 2) {
            listeners = listeners[0].match("&") ? listeners[0].split("&") : listeners;
            for (var ii = 0; ii < listeners.length; ii++) {
                listeners[ii].trim();
                element.addEventListener(listeners[ii], function() {
                    self.instance.render(element.attributes[type].value.split(":")[1] + SONNY.FILETYPE);
                });
            }
        } else {
            element.addEventListener(listeners[0], function() {
                self.instance.render(listeners[1] + SONNY.FILETYPE);
            });
        }
        return element;
    };

    /**
     * Render a virtual page
     */
    SONNY.Renderer = function() {

        if (arguments[0]) this.__instance = arguments[0];

    };

    SONNY.Renderer.prototype.constructor = SONNY.Renderer;

    /**
     * Render a page, attach it after successful compile
     * @param page (string) : public/home
     */
    SONNY.Renderer.prototype.render = function(page) {

        var self = this;

        if (page.match(SONNY.FILETYPE)) {
            page = page.split(SONNY.FILETYPE)[0];
        }

        if (!page instanceof String) throw new Error("Invalid page format!");

        this.page = this.get(page + SONNY.FILETYPE);

        this.__instance.CURRENTPAGE = page;

        var result = this.compile(this.page);

        for (var ii in result) {
            this.attach(result[ii]);
        }

        if (SONNY.HISTORY) {
            this.__instance.history.update(this.__instance.CURRENTPAGE);
        }

    };

    /**
     * @param page (string) : public/home
     * Clean the sonny instance page container for new content
     */
    SONNY.Renderer.prototype.kill = function(page) {
        if (this.__instance.BODY) {
            this.__instance.BODY.innerHTML = "";
        }
    };

    /**
     * Compile a virtual page to dom html
     * @param page (SONNY.Page)
     */
    SONNY.Renderer.prototype.compile = function(page) {
        var compiler = new SONNY.Compiler(this);
        var array = [];

        page = page.content || page;

        for (var ii in page) {
            array.push(compiler.JSON(page[ii]));
        }

        this.kill();

        return array;
    };

    /**
     * Parse dom html to the page container
     * @param page (html)
     */
    SONNY.Renderer.prototype.attach = function(page) {
        try {
            for (var ii in page) {
                this.__instance.BODY.appendChild(page[ii]);
            }
        } catch (e) { 
            throw new Error(e);
        }
    };

    /**
     * Extract virtual page from instance
     * @param page (string) : public/home
     */
    SONNY.Renderer.prototype.get = function(page) {

        var self = this;

        page = page.match("/") ? page.split("/") : page;

        var data,
            main,
            result;

        var _fetch = function(value, index) {
            if (self.__instance.PAGES[value]) {
                _fetch(self.__instance.PAGES[value], value);
            } else {
                var url = "";
                if (value && index) {
                    for (var ii in page) {
                        if (!page[ii].match(SONNY.FILETYPE)) {
                            url += page[ii] + "/";
                            if (self.__instance.PAGES[page[ii]]) {
                                data = self.__instance.PAGES[page[ii]];
                            }
                        } else {
                            url += page[ii];
                            main = url;
                            result = data[main];
                            if (!(data[main])) throw new Error("The page " + main + " does not exist or was not successfully loaded!");
                        }
                    }
                }
            }
        }

        for (var key in page) {
            _fetch(page[key]);
        }

        return result;
    };

    /**
     * Extends notification api
     */
    SONNY.Notifications = function() {

        if (arguments[0]) this.__instance = arguments[0];

        if (!("Notification" in window)) return;

        this.notifySupport = true;

        this.notification = null;

        this.permission = Notification.permission;

    };

    SONNY.Notifications.prototype.constructor = SONNY.Notifications;


    /**
     * Display a desktop notification
     * @param object (object) *object.title
     */
    SONNY.Notifications.prototype.show = function(object) {

        if (!this.notifySupport || !this.__instance.DISPLAYNOTIFICATIONS) return;

        if (this.permission === "granted") {
            if (typeof object !== 'object') return;

            /**
             * A title is necessary to define!
             */
            this.notification = new Notification(object.title, {
                tag: object.tag ? object.tag : null,
                body: object.message ? object.message : null,
                iconUrl: object.iconUrl ? object.iconUrl : null,
                icon: object.icon ? object.icon : null
            });

        } else if (this.permission !== 'denied') {
            this.getPermission(object);
        }
    };

    /**
     * Ask user for permission to display desktop notifications
     * @param object (object)
     */
    SONNY.Notifications.prototype.getPermission = function(object) {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                this.show(object);
            }
        });
    };

    /**
     * Connection over socket.io
     */
    SONNY.Connection = function() {

        if (!window.io) throw new Error("SonnyJS requires Socket.IO!");

        if (arguments[0]) this.__instance = arguments[0];
        else throw new Error("SONNY.Connection requires an instance!");

        this.connected = false;
        
        this.socket = io( window.location.host + ":" + this.__instance.CONNECTIONPORT );

        this.connected = true;

        this.__instance.ONLINE = true;

        this.notifications = this.__instance.notify;

        this.init();

    };

    SONNY.Connection.prototype.constructor = SONNY.Connection;

    /**
     * Initialize an connection
     * Display a notification after connected successfully
     */
    SONNY.Connection.prototype.init = function() {

        var self = this;

        this.socket.on('connect', function() {
            self.notifications.show({
                title: "SONNY.Connection",
                message: "Connection established!",
                icon: "http://sonnyjs.org/favicon-96x96.png"
            });
        });

        this.socket.on('disconnect', function() {
            self.notifications.show({
                title: "SONNY.Connection",
                message: "Connection closed!",
                icon: "http://sonnyjs.org/favicon-96x96.png"
            });
        });

    };

    /**
     * Manipulates browser history and adressbar
     * Used to bring back the feeling of non single page applications
     */
    SONNY.HistoryManager = function() {

        if (arguments[0]) this.__instance = arguments[0];

        if (!SONNY.HISTORY) return;

        this.originalURL = "";

        this.additionalURL = "";

        this.init();

    };

    SONNY.HistoryManager.prototype.constructor = SONNY.HistoryManager;

    /**
     * Initialize the history manager
     * Grab the current url and process additional question mark signs
     */
    SONNY.HistoryManager.prototype.init = function() {

        this.originalURL = SONNY.ORIGINALHISTORY;

        var originalURL = SONNY.ORIGINALHISTORY;

        var regex = new RegExp("\\?", "g");
            if (regex.test(originalURL)) {
                var splittedURL = originalURL.split("?");
                if (splittedURL[0] !== SONNY.ORIGINALHISTORY) {
                    SONNY.ORIGINALHISTORY = splittedURL[0];
                    this.originalURL = SONNY.ORIGINALHISTORY;
                }
                if (splittedURL.length) {
                    this.additionalURL = splittedURL[1];
                }
            }

    };
    
    /**
     * Update the adressbar with received value
     */
    SONNY.HistoryManager.prototype.update = function(value) {
        window.history.replaceState("", "", this.originalURL + "?" + value);
    };


    /**
     * A instance represents the core of a website session.
     * @param Page/settings object
     */
    SONNY.Instance = function(object, resolve) {

        /**
         * Increase global sonny initialized counter
         * to prevent multiple sonny instances
         */
        if (++SONNY.INITIALIZED > !false) throw new Error("Cannot run multiple sonny instances!");

        /**
         * Store myself in a variable to be visible in async operations
         */
        var self = this;

        /**
         * Displays a (chrome specific) message in the console
         */
        this.Greet();

        /**
         * Clone this instance
         */
        this.INSTANCE = this;

        /**
         * If defined, the page value will be rendered automatically after everything has loaded successfully
         */
        this.STARTPAGE = null;

        /**
         * The element container where a page get rendered into
         */
        this.PAGECONTAINER = "syContainer";

        /**
         * The current page a user is located
         */
        this.CURRENTPAGE = null;

        /**
         * The current window width
         */
        this.WIDTH = window.innerWidth;

        /**
         * The current window height
         */
        this.HEIGHT = window.innerHeight;

        /**
         * Is sonny in fullscreen mode or not?
         */
        this.FULLSCREEN = false;

        /**
         * A socket io connection has successfully established
         */
        this.ONLINE = false;

        /**
         * Either the user wants a socket io connection or not
         * Can be changed by the settings instance param
         */
        this.CONNECTION = false;

        /**
         * Default sonny socket io connection port
         * Can be changed by the settings instance param
         */
        this.CONNECTIONPORT = 9005;

        /**
         * Display sonnys notifications by default
         */
        this.DISPLAYNOTIFICATIONS = true;

        /**
         * Overwrite local instance settings by users's instance settings object
         */
        this.processSettings(object);

        /**
         * Save all unvirtualized pages
         */
        this.VIRTUALPAGES = object;

        /**
         * Either on a mobile platform or os
         */
        this.isMobile();

        /**
         * Update local instance size settings
         */
        this.resize();

        /**
         * Check if we already have access to the page parse container
         */
        this.BODY = $(this.PAGECONTAINER) || null;

        /**
         * Local renderer to render virtualized pages
         * @param this instance
         */
        this.renderer = new SONNY.Renderer(this);

        /**
         * Local interpreter to interpret virtualized page objects
         * @param this instance
         */
        this.interpreter = new SONNY.Interpreter(this);

        /**
         * Local compiler to virtualize HTML pages
         */
        this.compiler = new SONNY.Compiler(this);
        
        /**
         * Local notifications
         */
        this.notify = new SONNY.Notifications(this);

        /**
         * Simplifies the management of the browser history
         * Manipulates the adressbar
         */
        this.history = new SONNY.HistoryManager(this);

        /**
         * Create a page container if not already existing
         * Call virtualiser after successfully preparing the page container
         */
        this.createContainer(function() {
            SONNY.Virtualiser.call(self, function() {
                resolve();
                self.CONNECTION ? self.CONNECTION = new SONNY.Connection(self) : null;
            });
        });

    };

    SONNY.Instance.prototype = Object.create(SONNY.Virtualiser.prototype);

    SONNY.Instance.prototype.constructor = SONNY.Instance;


    /**
     * Create the page container
     * Wait for the lazy slow document
     */
    SONNY.Instance.prototype.createContainer = function(resolve) {
        var self = this;
        window.addEventListener('DOMContentLoaded', function() {
            if (!self.BODY && !self.CONTAINER) {
                var container = document.createElement(self.PAGECONTAINER);
                self.BODY = $("body");
                self.BODY.appendChild(container);
                self.BODY = $(container.tagName.toLowerCase());
            }
            resolve();
        });
    };

    /**
     * Process settings from instance declaration
     * @param object.Settings
     */
    SONNY.Instance.prototype.processSettings = function(object) {
        if (object.Settings) {
            if (!object.Settings instanceof Object) throw new Error("Invalid settings type");
            for (var ii in object.Settings) {
                if (object.Settings[ii] === null || object.Settings[ii] === undefined) throw new Error(ii + " value is invalid");
                var original = ii;
                ii = String(ii.toUpperCase());
                if (this[ii] !== undefined || this[ii] === null) {
                    this[ii] = object.Settings[original];
                }
            }
            delete object.Settings;
        }
    };

    /**
     * Displays a hello message in the console
     * and a special message in chrome browsers
     */
    SONNY.Instance.prototype.Greet = function() {
        if ( navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ) {
            var args = [
                '%c sonny.js ' + SONNY.VERSION + ' ->%c http://www.sonnyjs.org/ ',
                'color: #d9d9d9; background: #000',
                'background: #000'
            ];
            console.log.apply(console, args);
        } else if (window['console']) {
            console.log('sonny.js ' + SONNY.VERSION + ' -> http://www.sonnyjs.org/');
        }
    };

    /**
     * Mobile device detection
     */
    SONNY.Instance.prototype.isMobile = function() {
        if (navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)) {
            this.MOBILE = true;
        } else {
            this.MOBILE = false;
        }
    };

    /**
     * Listens for a window resize, updates instance variables on resizement
     */
    SONNY.Instance.prototype.resize = function() {

        var self = this;

        window.addEventListener('resize', function() {
            self.WIDTH = window.innerWidth;
            self.HEIGHT = window.innerHeight;
            window.scrollTo(0, 0);
        });
    };

    /**
     * Cross browser fullscreen toggle
     * @return true if fullscreen else false
     */
    SONNY.Instance.prototype.toggleFullscreen = function() {
        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
            this.FULLSCREEN = true;
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
            this.FULLSCREEN = false;
        }
        return this.FULLSCREEN;
    };

    /**
     * Cross browser ajax request
     */
    SONNY.GET = function() {
        var activexmodes = ['Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.3.0', 'Microsoft.XMLHTTP'];

        if (window.ActiveXObject) { //Support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
            for (var ii = 0; ii < activexmodes.length; ++ii) {
                try {
                    return new window.ActiveXObject(activexmodes[ii]);
                } catch (e) {
                    throw new Error(e);
                }
            }
        } else if (window.XMLHttpRequest) {
            return new window.XMLHttpRequest();
        } else {
            return false;
        }
    };

    if (window.SONNY) throw new Error("SonnyJS was already declared in this scope!");

    root.SONNY = SONNY;

}).call(this);