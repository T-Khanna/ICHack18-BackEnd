#!/usr/bin/env node

var port = process.env.port || 8080;
var io = require('socket.io')(port);

var fs = require('fs');

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
