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
    var index = fs.readFileSync(__dirname + req.url);
    res.end(index);
  } catch (err) {
    console.log("Couldn't find file: \n\t" + err);
    res.end();
  }
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);
app.listen(port);

var image_scores = {};
var NUMBER_OF_PLACES = 3;
var IMAGES_PER_PLACE = 3;

console.log("server listening on port " + port);
io.on('connection', function (socket) {
  console.log("user connected");
  socket.emit('server-message', 'nice to meet you');

  socket.on('search-places', function (searchTerm, userLocation) {
    getNearbyPlaces(searchTerm, userLocation, function(result) {
      console.log("found places, sending to clients");
      io.sockets.emit('place-results', result);
    });
  });

  socket.on('image', function(imagedata, place) {
    console.log("recieved file");
    var image_path = "/images/" + randomstring.generate() + ".jpg"
    fs.writeFileSync(__dirname + image_path, imagedata, "binary");
    console.log("saved file");

    if (image_scores[socket] == undefined) {
      image_scores[socket] = {};
    }
    // perform sentiment analysis here
    cognitive.cognitive(hostname_url + image_path, handle_emotion(socket, image_path, place))
  });

  socket.on('disconnect', function () {
    console.log("user disconnect");
    delete image_scores[socket];
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
    var top3Results = placesArray.slice(0, NUMBER_OF_PLACES);
    responseHandler(top3Results);
  });
}

function handle_emotion(socket, image_path, place) {
  console.log("analysing image " + image_path);
  return function (emotions) {
    //take first emotion
    console.log("got emotions " + JSON.stringify(emotions) + " for image: " + image_path);
    console.log("storing emotions for the images");

    // Store emotions for each image for each socket
    //image_scores[socket].push([]);
    if (image_scores[socket][place] == undefined) {
      image_scores[socket][place] = []
    }

    if (emotions.length == 0 ) {
      console.log("couldn't find any emotions for image at: " + image_path + ", place: " + place + ". Giving default score of 0.");
      image_scores[socket][place].push(0);
    } else {
      image_scores[socket][place].push(calculatePlaceScore(emotions[0]['scores']));
    }

    //Emotion debugging
    socket.emit('emotions', emotions);

    totalimages = totalImages(image_scores[socket]);
    console.log("number of images taken so, far " + totalimages + "/" + NUMBER_OF_PLACES * IMAGES_PER_PLACE);

    if (totalimages >= NUMBER_OF_PLACES * IMAGES_PER_PLACE) {
      // Recievd all images, choose best image
      // TODO: need all group to submit mages
      // choose place that is most prefered
      // send place back to everyone

      //[{"faceRectangle":{"height":782,"left":754,"top":1172,"width":782},
      // "scores":{"anger":0.000006604076,"contempt":0.00376007543,
      // "disgust":0.000002866387,"fear":8.441607e-9,
      // "happiness":0.0143168205,"neutral":0.98168993,
      // "sadness":0.000220218935,"surprise":0.000003459858}}]

      console.log("got " + NUMBER_OF_PLACES + " of places");

      var maxScore = -10;
      var placeIndex = -1;

      places = image_scores[socket];
      Object.keys(places).forEach(function (place) {
        var aggregateScore = 0;
        places[place].forEach(function (score) {
          aggregateScore += score;
        });
        if (aggregateScore > maxScore) {
          maxScore = aggregateScore;
          placeIndex = place;
        }
      });

      console.log("found highest score at place: " + placeIndex + ", with score " + maxScore);

//    for (var i = 0; i < NUMBER_OF_PLACES; i++) {
//      var aggregateScore = 0;
//      Object.keys(image_scores).forEach(function (user) {
//        aggregateScore += image_scores[user][i];
//      });
//      if (aggregateScore > maxScore) {
//        maxScore = aggregateScore;
//        placeIndex = i;
//      }
//    }

      socket.emit('best-place', placeIndex);
    }
  }
}

function totalImages(places) {
  total = 0;
  Object.keys(places).forEach(function (place) {
    places[place].forEach(function (score) {
      total += 1
    });
  });
  return total
}

function calculatePlaceScore(emotionScores) {
  var angerFactor = -1;
  var sadnessFactor = -0.5;
  var neutralFactor = 1;
  var surpriseFactor = 1.5;
  var happinessFactor = 2;
  return angerFactor * emotionScores['anger'] +
    sadnessFactor * emotionScores['sadness'] +
    neutralFactor * emotionScores['neutral'] +
    surpriseFactor * emotionScores['surprise'] +
    happinessFactor * emotionScores['happiness'];

}

module.exports = app;
