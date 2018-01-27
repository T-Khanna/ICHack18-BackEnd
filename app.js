#!/usr/bin/env node
var fs = require('fs');
var port = process.env.PORT || 8080;
var hostname_url = 'https://emotion-picker.herokuapp.com'
var http = require('http');
var randomstring = require('randomstring');
var cognitive = require('./cognitive.js');

// Send index.html to all requests 
var app = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'image/jpg'});
  try {
    index = fs.readFileSync(__dirname + req.url);
    res.end(index);
  } catch (err) {
    console.log("Couldn't find file: \n\t" + err);
    res.end();
  }
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);
app.listen(port);

image_scores = {};

console.log("server listening on port " + port);
io.on('connection', function (socket) {
  console.log("user connected");
  socket.emit('server-message', 'nice to meet you');

  socket.on('search-places', function (searchTerm, userLocation) {
    getNearbyPlaces(searchTerm, userLocation, function(result) {
      socket.emit('place-results', result);
    });
  });

  socket.on('image', function(imagedata) {
    console.log("recieved file");
    image_path = "/images/" + randomstring.generate() + ".jpg"
    fs.writeFileSync(__dirname + image_path, imagedata, "binary");
    console.log("saved file");

    image_scores[socket] = []
    // perform sentiment analysis here
    cognitive.cognitive(hostname_url + image_path, handle_emotion(socket, image_path))
  });

  socket.on('disconnect', function () {
    console.log("user disconnect");
  });
});

var gMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDyz2RwNSa3qDRfnclcIgUUWS7Fn5NexfA'
});

function getNearbyPlaces(searchTerm, userLocation, responseHandler) {
  var sort_by = function(field, reverse, primer) {
    var key = primer ?
      function(json) {return primer(json[field])} :
      function(json) {return json[field]};

    var reverseFactor = !reverse ? 1 : -1;

    return function (a, b) {
      return a = key(a), b = key(b), reverseFactor * ((a > b) - (b > a));
    }
  };
  var query = {
    query: searchTerm,
    location: userLocation,
    language: 'en',
    radius: 500,
    opennow: true
  };
  gMapsClient.places(query, function (err, response) {
    var placesArray = response.json['results'];
    // var sortedResults = placesArray.sort(sort_by('rating', true, parseFloat));
    var top3Results = placesArray.slice(0, 3);
    responseHandler(top3Results);
  });
}

function handle_emotion(socket, image_path) {
  console.log("analysing image " + image_path)
  return function (emotions) {
    //take first emotion
    console.log("got emotions " + JSON.stringify(emotions) + " for image: " + image_path);
    console.log("storing emotions for the images")

    // Store emotions for each image for each socket
    image_scores[socket].push({image_path: emotions});

    //Emotion debugging
    socket.emit('emotions', emotions);

    if (image_scores[socket].length >= 3) {
      // Recievd all images, choose best image
      // TODO: need all group to submit images
      // choose place that is most prefered
      // send place back to everyone
      console.log("recieved at least threee photos");
    }
  }
}

module.exports = app;
