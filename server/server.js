'use strict';

var http = require('http');
var Server = http.createServer(handler);
var io = require('socket.io').listen(Server);
var fs = require('fs');
var mySQL = require('mysql');
var crypto = require('crypto');

function handler(req, res) {
    fs.readFile(__dirname + '/index.html', function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200);
        res.end(data);
    });
}

function sendHeartbeat() {
    io.sockets.emit('ping', {
        beat: 1
    });
}

Server.listen(9005);

var onlineUsers = [];

// Boots user with undefined name.
function bootUnauthorized(socket) {
    if (typeof socket.clientname === 'undefined') {
        return true;
    }
    return false;
}

// Get the time as a string.
function getTime() {

    var currentTime = new Date(),
        hours = currentTime.getHours(),
        minutes = currentTime.getMinutes(),
        amOrPm = (hours > 11 ? 'PM' : 'AM');

    if (hours === 0) hours = 12;

    else if (hours > 12) hours = hours - 12;

    minutes = (minutes < 10 ? '0' + minutes : minutes);

    return hours + ':' + minutes + amOrPm;

}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validUserData(data, username, callback) {
    var query = 'SELECT ' + data + ' FROM users WHERE username=?';
    mySQL.query(query, [username], function(error, result) {
        if (result && result.length) {
            callback(result[0]);
        }
    });
}

function initializeUser(id, username, email, ipadress, sessionID) {

    console.log("\x1b[32;1m" + getTime() + " " + username + " logged in!\x1b[0m");

    // Create live user object.
    var user = {};
		user.id = id;
		user.username = username;
		user.email = email;
		user.session = sessionID;
		user.ip = ipadress;

    onlineUsers.push(user);

}

function disconnectClient(socket, callback) {
    if (typeof socket.clientname === 'undefined') return;

    var user = {};

    // First find the user.
    for (var ii = 0; ii < onlineUsers.length; ii++) {
        if (onlineUsers[ii].username == socket.clientname) {
            user = onlineUsers[ii];
            break;
        }
    }

    //Save user data in database
    var query = 'UPDATE users SET last_ip=?, last_page=? WHERE id=?',
        values = [user.ip, socket.page, user.id];
    mySQL.query(query, values);

    // remove client from onlineUsers array
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].username === socket.clientname) {
            onlineUsers.splice(i, 1);
        }
    }

    callback("public/login.html");

}

// Send a message to a specific socket connection
Server.send = function(socket, message) {
    socket.send(JSON.stringify(message), function(error) {
        if (error) {
            console.log('Error:', error, socket.nick);
        }
    });
}

// Validate the data received from clients
Server.validateData = function(data) {
    var i,
        type,
        valid = true;
    for (i = data.length - 1; i >= 0; i -= 1) {
        type = typeof data[i][0];
        if (type !== data[i][1]) {
            valid = false;
        } else if (data[i][2] !== undefined && data[i][2] === data[i][0]) {
            valid = false;
        }
    }
    return valid;
}

Server.validUserData = function(data, username, callback) {
    var query = 'SELECT ' + data + ' FROM users WHERE username=?';
    mySQL.query(query, [username], function(error, result) {
        if (result && result.length) {
            callback(result[0]);
        }
    });
}

setInterval(sendHeartbeat, 8000);

io.sockets.on('connection', function(socket) {

    var Alert = [];
		Alert.Title;
        Alert.Content;
	
	Alert.Title = "Hello Guest!";
    Alert.Content = "Welcome to sonnyJS!";
    Server.send(socket, ["alert", Alert.Content, Alert.Title]);

    var ip = socket.request.connection.remoteAddress;

    // Print the connected user's IP address
    console.log('\x1b[32;1mConnected: ' + ip + '\n \x1b[0m');


    // Set up what to do when receiving data from a client
    socket.on('message', function(data, callback) {
        try {
            data = JSON.parse('[' + data + ']');
        } catch (error) {
            console.log(error);
            return;
        }

        console.log(data);

        if (data[0] == "userAction" && Server.validateData([
                [data[0], 'string'],
                [data[1], 'string']
            ])) {
            // User wants to do login..
            if (data[1] == "login" && data[2][0] && data[2][1]) {
                var username = data[2][0];
                var password = crypto.createHash('md5').update(data[2][1]).digest('hex');

                mySQL.query('SELECT id, username, password, email, last_ip, last_page FROM users WHERE username=? AND password=?', [username, password], function(error, result) {
                    if (result && result.length) {

                        var id = result[0].id;
                        var username = result[0].username;
                        var email = result[0].email;
                        var lastPage = result[0].last_page;

                        initializeUser(id, username, email, ip, socket.id);
                        socket.clientname = username;
                        socket.clientid = id;
                        socket.page = lastPage;

						Alert.Title = "Login success!";
                        Alert.Content = "Welcome back " + socket.clientname + "!";
                        Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                        if (socket.page) {
                            Server.send(socket, ["loadPage", socket.page + ".html", data]);
                        } else {
                            Server.send(socket, ["loadPage", "private/home.html"]);
                        }

                    } else {
						Alert.Title = "Login failed!";
                        Alert.Content = "Your login credentials are invalid, please try again!";
                        Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                    }
                });
            }
            // User wants to logout
            if (data[1] == "logout") {
                disconnectClient(socket, function(data) {
                    Server.send(socket, ["loadPage", data]);
                });
                socket.disconnect();
            }
            // User wants to register..
            if (data[1] == "register" && data[2][0] && data[2][1] && data[2][2] && data[2][3] && Server.validateData([
                    [data[2][0], 'string'],
                    [data[2][1], 'string'],
                    [data[2][2], 'string'],
                    [data[2][3], 'string']
                ])) {
				Alert.Title = "Registration failed!";
                if (data[2][0].length >= 4 && data[2][0].length <= 12) {
                    if (validateEmail(data[2][1])) {
                        if (data[2][2].length >= 4 && data[2][2].length <= 32) {
                            if (data[2][3].length >= 4 && data[2][3].length <= 32) {
                                if (data[2][2] == data[2][3]) {
                                    mySQL.query('SELECT username FROM users WHERE username=?', [data[2][0]], function(error, result) {
                                        if (result && result.length) {
                                            Alert.Content = "This username is already in use!";
                                            Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                        } else {
                                            mySQL.query('SELECT email FROM users WHERE email=?', [data[2][1]], function(error, result) {
                                                if (result && result.length) {
                                                    Alert.Content = "Email is already in use!";
                                                    Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                                } else {
                                                    var registerPassword = crypto.createHash('md5')
                                                        .update(data[2][2])
                                                        .digest('hex');
                                                    mySQL.query('INSERT INTO users(username,password,email,last_ip) VALUES(?,?,?,?)', [data[2][0], registerPassword, data[2][1], ip]);
													Alert.Title = "Registration success!";
                                                    Alert.Content = "You can Login now!";
                                                    Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    Alert.Content = "Passwords does not match";
                                    Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                }
                            } else {
                                Alert.Content = "Password is invalid";
                                Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                            }
                        } else {
                            Alert.Content = "Password is invalid";
                            Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                        }
                    } else {
                        Alert.Content = "Email is invalid";
                        Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                    }
                }
            }

            if (data[1] == "updateUserPassword" && Server.validateData([
                    [data[2][0], 'string'],
                    [data[2][1], 'string'],
                    [data[2][2], 'string']
                ])) {
				Alert.Title = "Password changing failed!";
                if (bootUnauthorized(socket)) return;
                if (data[2][0].length && data[2][1].length && data[2][2].length) {
                    if (data[2][0].length >= 4 && data[2][0].length <= 32 && data[2][1].length >= 4 && data[2][1].length <= 32 && data[2][2].length >= 4 && data[2][2].length <= 32) {
                        if (data[2][1] == data[2][2]) {
                            mySQL.query('SELECT username, password FROM users WHERE username=?', [socket.clientname], function(error, result) {
                                if (result && result.length) {
                                    var md5Password = crypto.createHash('md5').update(data[2][2]).digest('hex');
                                    var oldPassword = crypto.createHash('md5').update(data[2][0]).digest('hex');
                                    if (result[0].password === oldPassword) {
                                        if ( result[0].password == md5Password ) {
                                            Alert.Content = "Your passwords shall not match!";
                                            Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                        } else {
                                            mySQL.query('UPDATE users SET password=? WHERE username=?', [md5Password, socket.clientname]);
											Alert.Title = "Password changing success!";
                                            Alert.Content = "Your password was updated!";
                                            Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                        }
                                    } else {
                                        Alert.Content = "Your current password is wrong!";
                                        Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                                    }
                                }
                            });
                        } else {
                            Alert.Content = "The new passwords doesn't match!";
                            Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                        }
                    } else {
                        Alert.Content = "The choosen password is too long or too short!";
                        Server.send(socket, ["alert", Alert.Content, Alert.Title]);
                    }
                }
            }

			/*
            if (data[1] == "updateUserUsername" && Server.validateData([
                    [data[2][0], 'string']
                ])) {
                if (bootUnauthorized(socket)) return;
                mySQL.query('SELECT username FROM users WHERE username=?', [data[2][0]], function(error, result) {
                    if (result && result.length) {
                        Alert.Content = "This username is already taken, please choose another!";
                        Server.send(socket, ["alert", Alert.Content]);
                    } else {
                        mySQL.query('SELECT username FROM users WHERE username=?', [socket.clientname], function(error, result) {
                            if (result && result.length) {
                                if (data[2][0] !== result[0].username) {
                                    mySQL.query('UPDATE users SET username=? WHERE username=?', [data[2][0], socket.clientname]);
                                        socket.clientname = data[2][0];
                                        Alert.Content = "Your username was updated!";
                                        Server.send(socket, ["alert", Alert.Content]);
                                } else {
                                    Alert.Content = "Please enter a new username!";
                                    Server.send(socket, ["alert", Alert.Content]);
                                }
                            }
                        });
                    }
                });

            }
			*/



        };

        // Client wants some informations
        if (data[0] == "getUserData" && Server.validateData([
                [data[0], 'string'],
                [data[1], 'string']
            ])) {
            if (bootUnauthorized(socket)) {
                console.log("Unauthorized User!");
                disconnectClient(socket, function(data) {
                    Server.send(socket, ["loadPage", data]);
                });
                return;
            }
            var row = data[1];
            if (row.match("password")) return;
            Server.validUserData(row, socket.clientname, function(key) {
                Object.keys(key).forEach(function(keys) {
                    callback(key[keys]);
                });
            });
        }
		
    });


    socket.on('disconnect', function() {
        disconnectClient(socket, function(data) {
            Server.send(socket, ["loadPage", data]);
        });
        console.log("\x1b[36m" + ip + " disconnected!\x1b[0m");
    });

});

// Initiate the database connection
mySQL.connection = 'mysql://root:@localhost/sonnyJS';
mySQL.stream = mySQL.createConnection(mySQL.connection);
mySQL.stream.on('error', function(error) {
    mySQL.stream = mySQL.createConnection(mySQL.connection);
});
mySQL.query = function(query, values, callback) {
    mySQL.stream.query(query, values, callback);
};
global.mySQL = mySQL;