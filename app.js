#!/usr/bin/env node
var fs = require('fs');

var port = process.env.PORT || 8080;
const server = require('http').createServer();
const io = require('socket.io')(server, {
  path: '/path',
  serveClient: true,
  // below are engine.IO options
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

server.listen(port);
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
