var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

// storage variable
var thoughtsTemp;
// load css files
app.use(express.static(__dirname + "/assets"));
app.get("/", function(req, res) {
    res.sendFile("/index.html");
});

// load storage file
fs = require('fs')
fs.readFile('./assets/thoughts.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
    // put into storage
    thoughtsTemp = eval(data);
});

io.on("connection", function(socket) {
    // tell console a new user connected to the server
    console.log("user connected");
    // handling initial request for previous contents
    socket.on("initialContentRequest", function() {
        console.log("sending initial content request to new user");
        // sending one at a time for less memory usage
        for(sendingCounter = 1; sendingCounter < thoughtsTemp.length; sendingCounter++) {
            socket.emit("initialContent", {message: thoughtsTemp[sendingCounter][0], code: thoughtsTemp[sendingCounter][1]});
        }
        // after finished sending, tell the client to put the data onto the div on the screen
        socket.emit("contentSent");
    });
    socket.on("newThought", function(data) {
        socket.emit("refreshSignal");
        thoughtsTemp[0] = (Number(thoughtsTemp[0]) + 1).toString();
        thoughtsTemp.splice(1, 0, [data.message, thoughtsTemp[0].toString(16)]);
        console.log(thoughtsTemp);
        // signal for code alert
        var codeSend = Number(thoughtsTemp[0]).toString(16);
        socket.emit("newCodeAlert", {code: codeSend});
        // write to file for storage
        var fs = require('fs');
        fs.writeFile("./assets/thoughts.txt", JSON.stringify(thoughtsTemp), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Storage file saved");
        });
        for(refreshCounter = 1; refreshCounter < thoughtsTemp.length; refreshCounter++) {
            socket.emit("refreshContent", {message: thoughtsTemp[refreshCounter][0], code: thoughtsTemp[refreshCounter][1]});
        }
        socket.emit("contentSent");
    });
    // when user disconnect from the server
    socket.on("disconnect", function() {
        console.log("user disconnected");
    });
});

// tell server to listen on port (offline development)
http.listen(process.env.PORT || 3000, function() {
    console.log("listening on port " + app.get('port'));
});