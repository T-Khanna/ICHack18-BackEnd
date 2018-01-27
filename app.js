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

var gMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDyz2RwNSa3qDRfnclcIgUUWS7Fn5NexfA'
});

function getNearbyPlaces(searchTerm, userLocation, responseHandler) {
  var query = {
    query: searchTerm,
    location: userLocation,
    language: 'en',
    radius: 2000,
    opennow: true
  };

  var sort_by = function(field, reverse, primer) {
    var key = primer ?
      function(json) {return primer(json[field])} :
      function(json) {return json[field]};

    var reverseFactor = !reverse ? 1 : -1;

    return function (a, b) {
      return a = key(a), b = key(b), reverseFactor * ((a > b) - (b > a));
    }
  };
  gMapsClient.places(query, function (err, response) {
    var placesArray = response.json['results'];
    var sortedResults = placesArray.sort(sort_by('rating', true, parseFloat));
    responseHandler(sortedResults);
  });
}
