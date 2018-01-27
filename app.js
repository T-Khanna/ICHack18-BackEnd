#!/usr/bin/env node
var fs = require('fs');
var port = process.env.PORT || 8080;
var http = require('http');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
res.writeHead(200, {'Content-Type': 'text/html'});
  index = fs.readFileSync(__dirname + '/index.html');
  res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);
app.listen(port);

console.log("server listening on port " + port);

io.on('connection', function (socket) {
  console.log("user connected");
  socket.emit('server-message', 'nice to meet you');

  socket.on('message', function (from, msg) {
    console.log('message by ', from, ' saying ', msg);
  });

  socket.on('disconnect', function () {
    console.log("user disconnect");
  });
});
