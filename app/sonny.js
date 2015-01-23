/**
 * sonnyJS v0.0.5
 * www.github.com/felixmaier/sonnyJS
 * @author Felix Maier
 */

(function() { 'use strict'

    var $ = function() {
        return document.querySelector(arguments[0]);
    };

    var root = this;

    var SONNY = SONNY || {};

        SONNY.VERSION = "0.0.5";

        SONNY.INITIALIZED = false;

        SONNY.PAGEPATH = "view/";

        SONNY.FILETYPE = ".html";

        SONNY.SHOWVERSION = false;

        /**
         * Manages all virtual pages
         * @methods add, remove, init
         */
        SONNY.Virtualiser = function(resolve) {

            var self = this;

            if (!SONNY.LOADED) {
                this.init(this.VIRTUALPAGES, function(result) {
                    self.PAGES = result;
                    SONNY.LOADED = true;
                    if (self.STARTPAGE) {
                        var renderer = new SONNY.Renderer(self);
                            renderer.render(self.STARTPAGE);
                    }
                    resolve();
                });
            }

        };

        SONNY.Virtualiser.prototype.constructor = SONNY.Virtualiser;

        /**
         * Compile every page into a virtual page
         * @param data (object)
         */
        SONNY.Virtualiser.prototype.init = function(data, resolve) {

            var self = this;

            var pageObject = new Object,
                loadedPages = 0;

            (function load(data, index) {
                Object.keys(data).forEach(function(key) {
                    if (!(data[key] instanceof Object)) {
                        ++loadedPages;
                    }
                    if (data[key] instanceof Object) {
                        if (self.VIRTUALPAGES[key]) {
                            pageObject[key] = {};
                            load(data[key], key);
                        }
                    } else {
                        if (pageObject[index]) {
                            self.load(SONNY.PAGEPATH + data[key], function(resp) {

                                var compiler = new SONNY.Compiler();

                                var DOM = compiler.DOM(resp);
                                var DOMOBJECT = compiler.HTML(DOM);
                                    DOMOBJECT.content = DOMOBJECT.inside;
                                    DOMOBJECT.path = data[key];

                                    delete DOMOBJECT.inside;

                                pageObject[index][data[key]] = new SONNY.Page(DOMOBJECT);

                                --loadedPages;
                                if (loadedPages <= 0) {
                                    resolve(pageObject);
                                }
                            });
                        }
                    }
                });
            }(this.VIRTUALPAGES));
        };

        /**
         * Add a page object to the pageInstances
         * @param: url (string) : public/home
         */
        SONNY.Virtualiser.prototype.load = function(url, resolve) {
            var request = new SONNY.GET();
                request.onload = function() {
                if (this.status === 200) {
                    resolve(this.responseText);
                } else {
                    throw new Error ("Status code was " + this.status);
                }
            };
            request.open('GET', url, true);
            if (request.overrideMimeType) request.overrideMimeType('text/html');
            request.send(null);
        };

        /**
         * Represents a page object
         * @param name (string) name of the page
         * @param server (boolean) page requires server values
         * @param content (object) content of the page to render
         * @param ready (boolean) page is in an ready to be rendered state
         */
        SONNY.Page = function(page) {
            this.name = String(page["sy-sitename"]);
            this.path = String(page.path);
            this.requireServer = Boolean(page["sy-requireserver"]) || false;
            this.content = page.content;
            this.ready = true;
        };

        SONNY.Page.prototype.constructor = SONNY.Page;

        /**
         * Compiler to virtualise html and render objects
         */
        SONNY.Compiler = function() {

            this.instance = this;

            if (arguments[0]) {
                this.vivifier = new SONNY.Vivifier(arguments[0]);
            }

        };

        SONNY.Compiler.prototype.constructor = SONNY.Compiler;

        /**
         * Compile a html string into dom html
         * @param html (string)
         */
        SONNY.Compiler.prototype.DOM = function(html) {
            this.HTMLDOM = document.implementation.createHTMLDocument("html");
            this.HTMLDOM.documentElement.innerHTML = html;
            return this.HTMLDOM.body.children[0];
        };

        /**
         * Compile html to an json object
         */
        SONNY.Compiler.prototype.HTML = function(object) {
            if (!object instanceof Object) throw new Error ("Received arguments of invalid type");
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
                    if (child.nodeType === 1 && child.nodeName !== 'SCRIPT') {
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
        SONNY.Compiler.prototype.JSON = function(data) {
            var element,
                array = [];

            var self = this;

            Object.keys(data).forEach(function(key) {
                if (key === "key") {
                    element = document.createElement(data.key);
                } else if (key === "text") {
                    element.innerHTML = data.text;
                } else {
                    if (key === "inside") {
                        if (data.inside instanceof Object) {
                            for (var ii = 0; ii < data.inside.length; ++ii) {
                                var insideElements = self.JSON(data.inside[ii]);
                                element.appendChild(insideElements[0]);
                            }
                        }
                    } else {
                        try {
                            // Don't render backups
                            if (key !== "backup") element.setAttribute(key, data[key]);
                        }
                        catch (e) {
                            throw new Error ("JSON rendering failed: " + e);
                        }
                    }
                }
            });

            if (this.vivifier) {
                element = this.vivifier.vivify(element);
            }

            array.push(element);

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

            this.LOAD = "sy-load";
            this.MINMAX = "sy-min-max";
            this.ACTION = "sy-action";
            this.IMAGE = "sy-image";

            if (!element) throw new Error("Invalid element type!");

            if (element.attributes[this.LOAD]) {
                if (element.attributes[this.LOAD].value.match(":")) {
                    element = this.addListeners(element, this.LOAD);
                } else {
                    element.addEventListener('click', function() {
                        self.instance.render(element.attributes[self.LOAD].value + SONNY.FILETYPE);
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
                for (var ii = 0; ii < listeners.length; ii++){
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
        SONNY.Renderer = function(instance) {

            this.instance = instance;

            this.QUEUE = [];

        };

        SONNY.Renderer.prototype.constructor = SONNY.Renderer;

        /**
         * @param page (string) : public/home
         */
        SONNY.Renderer.prototype.render = function(page) {

            if (!page instanceof String) throw new Error("Invalid page format!");

            this.get(page);

            this.compile(this.QUEUE.shift());

            this.instance.CURRENTPAGE = page;

        };

        /**
         * @param page (string) : public/home
         */
        SONNY.Renderer.prototype.kill = function(page) {
            if (this.instance.BODY) {
                this.instance.BODY.innerHTML = "";
                this.instance.CURRENTPAGE = null;
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

            this.attach(array);
        };

        /**
         * Parse html to the page container
         * @param page (html)
         */
        SONNY.Renderer.prototype.attach = function(page) {
            try {
                for (var ii in page) {
                    this.instance.BODY.appendChild(page[ii][0]);
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

            Object.keys(page).forEach(function(key) {
                fetch(page[key]);
            });

            function fetch(value, index) {
                if (self.instance.PAGES[value]) {
                    fetch(self.instance.PAGES[value], value);
                } else {
                    var url = "";
                    if (value && index) {
                        for (var ii in page) {
                            if (!page[ii].match(SONNY.FILETYPE)) {
                                url += page[ii] + "/";
                                if (self.instance.PAGES[page[ii]]) {
                                    data = self.instance.PAGES[page[ii]];
                                }
                            } else {
                                url += page[ii];
                                main = url;
                                if (!(data[main])) throw new Error ("The page " + main + " does not exist or was not successfully loaded!");
                                self.QUEUE.push(data[main]);
                            }
                        }
                    }
                }
            }
        };

        /**
         * @param Page/settings object
         */
        SONNY.Instance = function(object, resolve) {

            var self = this;

            if (SONNY.INITIALIZED) throw new Error("Cannot run multiple sonny instances");

            this.INSTANCE = this;

            this.STARTPAGE = null;

            this.PAGECONTAINER = "syContainer";

            this.CURRENTPAGE = null;

            this.WIDTH = window.innerWidth;

            this.HEIGHT = window.innerHeight;

            this.FULLSCREEN = false;

            this.ONLINE = false;

            if (object.Settings) {
                if (!object.Settings instanceof Object) throw new Error ("Invalid settings type");
                for (var ii in object.Settings) {
                    if (object.Settings[ii] === null || object.Settings[ii] === undefined) throw new Error ( ii + " value is invalid");
                    var original = ii;
                    ii = String(ii.toUpperCase());
                    if (this[ii] || this[ii] === null) {
                        this[ii] = object.Settings[original];
                    }
                }
                delete object.Settings;
            } else throw new Error ("No settings defined!");

            this.VIRTUALPAGES = object;

            this.isMobile();

            this.resize();

            this.BODY = $(this.PAGECONTAINER) || null;

            this.createContainer( function() {
                SONNY.INITIALIZED = true;
                SONNY.Virtualiser.call(self, function() {
                    resolve();
                });
            });

        };

        SONNY.Instance.prototype = Object.create(SONNY.Virtualiser.prototype);

        SONNY.Instance.prototype.constructor = SONNY.Instance;


        /**
         * Create the page container 
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
         * Cross browser ajax request
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

        /**
         * Cross browser fullscreen toggle
         * @return true if fullscreen else false
         */
        SONNY.Instance.prototype.toggleFullscreen = function() {
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

        // Prevent multiple sonny instances
        if (window.SONNY) throw new Error ("Another instance of sonnyJS is already initialized!");

        root.SONNY = SONNY;


}).call(this);
