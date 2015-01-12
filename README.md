# sonnyJS

### What is sonnyJS?

A small javascript framework (and my first project) to fit my own purposes and learn javascript.<br/>

With sonnyJS you can easily create web based single page applications - At least only a basic html knowledge is required to use the basic features of sonnyJS.

### Help

 * Template folders lies in view/*
 * Server and database template are lying in the server folder
 * Include sonny.js into your website header to load it

### Initialize sonnyJS

Go to your main index file and open a script tag.

First create an empty object. The object will bumped into SONNY.init later.

```javascript
var SonnyPages = {};
```
Extend the object as following:
```javascript
SonnyPages.public = [
	'public/home.html',
	'public/settings.html'
];
```
Everything before the slash sign is interpreted as a folder, lastly the file has to be defined.<br/>

All templates are stored in the <b>view folder</b> by default.

Finally initialize Sonny with the filled object.
```javascript
SONNY.init(SonnyPages);
```

### Sonny HTML attributes
 * ### sy-load
 Loads a specific page from the preloaded virtual sonny pages.<br/>
 
 <b>Usage:</b> <br/>
 ```<div sy-load="public/home">```<br/>
 
 <b>Custom Listeners:</b><br/> ```<div sy-load="mouseover:public/home">```<br/>
 * ### sy-min-max:
 Adds a min and max length requirement.<br/>
 
 <b>Usage:</b> <br/>```<input type="text" sy-min-max="3,6">```<br/>
 * ### sy-action
 Adds an event to handle by a nodeJS server.<br/>
 
 <b>Usage:</b> ```<div sy-action="login">```<br/>
 
 <b>Custom Listeners:</b> ```<div sy-action="mouseover:login">```<br/>
 
 <b>Attach values:</b>
 ```
 <input type="text" name="username">
 <input type="text" name="password">
 <div sy-action="login" sy-action-values="username,password">
 ```
 * ### sy-image
  Hide an image until its loaded.<br/>
  
   <b>Usage:</b> <br/>
 ```<img sy-image="assets/img/example.png">```<br/><br/>
 
 
### Sonny functions
 * ### SONNY.render
 Render and display a specific already preloaded page.<br/>
  
   <b>Usage:</b> <br/>
   ```SONNY.render("public/login.html");```<br/>
