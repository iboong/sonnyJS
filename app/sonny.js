/**
 * sonnyJS v0.0.5
 * www.github.com/felixmaier/sonnyJS
 * @author Felix Maier
 */

(function() { 'use strict'

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
        SONNY.PageManager = function(resolve) {

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

        SONNY.PageManager.prototype.constructor = SONNY.PageManager;

        /**
         * Compile every page into a virtual page
         * @param data (object)
         */
        SONNY.PageManager.prototype.init = function(data, resolve) {

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
                               pageObject[index][data[key]] = resp;

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
        SONNY.PageManager.prototype.load = function(url, resolve) {
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
            switch (typeof arguments[0]) {
                case 'object':
                    return new this.HTML(arguments[0]);
                    break;
                case 'HTMLElement' || 'Element':
                    return new this.JSON(arguments[0]);
                    break;
                case 'string':
                    return new this.DOM(arguments[0]);
                    break;
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
                        virtualPage.inside.push(new SONNY.Compiler(child));
                    }
                    child = child.nextSibling;
                }
            }
            return virtualPage;
        };

        /**
         * Compile json object into dom html
         */
        SONNY.Compiler.prototype.JSON = function(object) {
            var element,
                array = [];

            Object.keys(data).forEach(function(ii) {
                if (ii === "key") {
                    element = document.createElement(data.key);
                } else if (ii === "text") {
                    element.innerHTML = data.text;
                } else {
                    if (ii === "inside") {
                        if (data.inside instanceof Object) {
                            for (var key = 0; key < data.inside.length; ++key) {
                                var insideElements = new SONNY.Compiler(data.inside[key]);
                                element.appendChild(insideElements[0]);
                            }
                        }
                    } else {
                        try {
                            // Don't render backups
                            if (ii !== "backup") element.setAttribute(ii, data[ii]);
                        }
                        catch (e) {
                            throw new Error ("JSON rendering failed: " + e);
                        }
                    }
                }
            });

            array.push(element);

            return array;
        };

        /**
         * Render a virtual page
         */
        SONNY.Renderer = function(instance) {

            this.__instance = instance;

        };

        SONNY.Renderer.prototype.constructor = SONNY.Renderer;

        /**
         * @param page (string) : public/home
         */
        SONNY.Renderer.prototype.render = function(page) {

            if (!page instanceof String) throw new Error("Invalid page format!");

            this.__instance.CURRENTPAGE = page;

            this.get(page);

            this.compile(this.__instance.RENDERQUEUE.shift());

        };

        /**
         * @param page (string) : public/home
         */
        SONNY.Renderer.prototype.kill = function(page) {
            var body = document.querySelector(this.__instance.PAGECONTAINER);
            if (body) {
                body.innerHTML = "";
                this.__instance.CURRENTPAGE = null;
            }
        };

        /**
         * @param page (SONNY.Page)
         */
        SONNY.Renderer.prototype.compile = function(page) {
            console.log(page);
        };

        /**
         * Extract virtual page from instance
         * @param page (string) : public/home
         */
        SONNY.Renderer.prototype.get = function(page) {

            var self = this.__instance;

            page = page.match("/") ? page.split("/") : page;

            var data,
                main,
                result;

            Object.keys(page).forEach(function(key) {
                getPage(page[key]);
            });

            function getPage(value, index) {
                if (self.PAGES[value]) {
                    getPage(self.PAGES[value], value);
                } else {
                    var url = "";
                    if (value && index) {
                        for (var ii in page) {
                            if (!page[ii].match(SONNY.FILETYPE)) {
                                url += page[ii] + "/";
                                if (self.PAGES[page[ii]]) {
                                    data = self.PAGES[page[ii]];
                                }
                            } else {
                                url += page[ii];
                                main = url;
                                if (!(data[main])) throw (": Page "+main+" does not exist!");
                                self.RENDERQUEUE.push(data[main]);
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

            if (SONNY.INITIALIZED) throw new Error("Cannot run multiple sonny instances");

            this.INSTANCE = this;

            this.STARTPAGE = null;

            this.PAGECONTAINER = null;

            this.CURRENTPAGE = null;

            this.WIDTH = window.innerWidth;

            this.HEIGHT = window.innerHeight;

            this.FULLSCREEN = false;

            this.ONLINE = null;

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

            this.RENDERQUEUE = [];

            this.isMobile();

            this.resize();

            SONNY.INITIALIZED = true;

            SONNY.PageManager.call(this, function() {
                resolve();
            });

        };

        SONNY.Instance.prototype = Object.create(SONNY.PageManager.prototype);

        SONNY.Instance.prototype.constructor = SONNY.Instance;


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


(function() {

var SonnyPages = {};
    // Pages for guests
    SonnyPages.public = [
        'public/login.html',
        'public/register.html'
    ];
    // Pages for logged in users
    SonnyPages.private = [
        'private/home.html',
        'private/settings.html'
    ];

    // Define settings here
    SonnyPages.Settings = {
        startpage: "public/login.html",
        pagecontainer: "syContainer",
        online: false
    }

    var instance = new SONNY.Instance(SonnyPages, function() {
        // Do anything you want here
        var renderer = new SONNY.Renderer(instance);
            renderer.render("public/login.html");
    });

})();