/**
 * sonnyJS v0.0.1
 * www.github.com/felixmaier/sonnyJS
 * @author Felix Maier
 */

(function() {

    var root = this;

    var SONNY = SONNY || {};

        SONNY.VERSION = "0.0.1";

        SONNY.LOADED = false;

        SONNY.INITIALIZED = false;

        SONNY.CURRENTPAGE = null;

        SONNY.PAGES = {};

        SONNY.WIDTH = null;

        SONNY.HEIGHT = null;

        SONNY.MOBILE = null;

        SONNY.FULLSCREEN = false;

        SONNY.PAGEPATH = "view/";

        SONNY.FILETYPE = ".html";

        SONNY.STARTPAGE = null;

        SONNY.SHOWVERSION = false;

        SONNY.SERVER = null;

        SONNY.PAGECONTAINER = "syContainer";

        /**
         * Manages all virtual pages
         * @methods: add, remove, init
         */
        SONNY.PageManager = function() {
            if (!SONNY.LOADED) {
                this.init(this.virtualPages, function(result) {
                    SONNY.PAGES = result;
                    SONNY.LOADED = true;
                    console.log(SONNY);
                });
            }	
        };
	
        SONNY.PageManager.prototype.constructor = SONNY.PageManager;

        /**
         * Compile every page into a virtual page
         * @param: object, callback
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
                        if (self.virtualPages[key]) {
                            pageObject[key] = {};
                            load(data[key], key);
                        }
                    } else {
                        if (pageObject[index]) {
                            self.load(SONNY.PAGEPATH + data[key], function(resp) {
                                pageObject[index][data[key]] = resp;
                                --loadedPages;
                                if (loadedPages <= 0) {
                                    resolve(pageObject);
                                }
                            });
                        }
                    }
                });
            }(this.virtualPages));
        };


        /*
         * Add a page object to the pageInstances
         * @param: public/home
         */
        SONNY.PageManager.prototype.add = function(page) {
            if (!this.pageInstances.page + SONNY.FILETYPE) {
                this.pageInstances[ page + SONNY.FILETYPE ] = page + SONNY.FILETYPE;
            } else throw ("Can't add " + page + "!");
        };

        /*
         * Remove a page object from the pageInstances
         * @param: public/home
         */
        SONNY.PageManager.prototype.remove = function(page) {
            if (this.pageInstances.page + SONNY.FILETYPE) {
                delete this.pageInstances.page + SONNY.FILETYPE;
            } else throw ("Can't remove " + page + "!");
        };

        /*
         * Add a page object to the pageInstances
         * @param: public/home
         */
        SONNY.PageManager.prototype.load = function(url, resolve) {	
            this.request = new SONNY.GET();
            this.request.onload = function() {
                if (this.status === 200) {
                    resolve(this.responseText);
                } else {
                    throw ("Status code was " + this.status);
                }
            };
            this.request.open('GET', url, true);
            if (this.request.overrideMimeType) this.request.overrideMimeType('text/html');
            this.request.send(null);
        };

        /**
         * Compiler to virtualise html and render objects
         */
        SONNY.Compiler = function() {
			
        };

        SONNY.Compiler.prototype.constructor = SONNY.Compiler;

        /*
         * Compile html to an object
         */
        SONNY.Compiler.prototype.HTML = function(object) {
            if (!object instanceof Object) throw new Error ("Received arguments of invalid type");
            var virtualPage = {};
                virtualPage.key = object.tagName.toLowerCase();
            if (object.hasAttribute) {
                for (i = 0; i < object.attributes.length; i++) {
                    virtualPage[object.attributes[i].name] = object.attributes[i].value;
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

        /*
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
                                var insideElements = this.JSON(data.inside[key]);
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

            array.push(element);

            return array;
        };


        /**
         * @param: Page object
         */
        SONNY.Instance = function(Pages) {

            this.instance = this;

            this.virtualPages = Pages;

            SONNY.PageManager.call(this);

        };

        SONNY.Instance.prototype = Object.create(SONNY.PageManager.prototype);

        SONNY.Instance.prototype.constructor = SONNY.Instance;

			
        /**
         * Cross browser ajax request
         */
        SONNY.GET = function() {
            var activexmodes = ['Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.3.0', 'Microsoft.XMLHTTP'];

            if (window.ActiveXObject) { //Test for support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
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


        // Prevent multiple sonny instances
        if (window.SONNY) throw ("Another instance of sonnyJS is already loaded!");

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

    new SONNY.Instance(SonnyPages);

})();