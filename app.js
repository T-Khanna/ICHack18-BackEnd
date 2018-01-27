#!/usr/bin/env node

var port = process.env.port || 8080;
var io = require('socket.io')(port);

var fs = require('fs');

io.on('connection', function (socket) {
    io.emit('this', { will: 'be received by everyone'});

    console.log("connected");

    socket.on('private message', function (from, msg) {
          console.log('I received a private message by ', from, ' saying ', msg);
          socket.emit('user disconnected');
        });

    socket.on('disconnect', function () {
          io.emit('user disconnected');
        });
});
