var Settings = {
    Pages: {},
    PagePath: "app/view/",
	loadFileType: ".html",
	startPage: "public/login.html",
	showVersion: false,
	Server: true,
	port: 9005,
	preloadImages: true,
	PreloadAnimation: true,
	preloaderText: "",
	fullscreenButton: true,
	body: "#page"
};
// Pages for guests
Settings.Pages.public = [
    'public/login.html',
	'public/register.html'
];
// Pages for logged in users
Settings.Pages.private = [
    'private/home.html',
    'private/settings.html'
];