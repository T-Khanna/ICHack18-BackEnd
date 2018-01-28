#!/usr/bin/env node
var fs = require('fs');
var port = process.env.PORT || 8080;
var hostname_url = 'https://emotion-picker.herokuapp.com'
var http = require('http');
var randomString = require('randomstring');
var cognitive = require('./cognitive.js');
var ReadWriteLock = require('rwlock');

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

var connected_users = {};
var unfinished_clients = 0;
var unfinished_clients_lock = new ReadWriteLock();
var NUMBER_OF_PLACES = 3;
var IMAGES_PER_PLACE = 3;

console.log("server listening on port " + port);
io.on('connection', function (socket) {
  console.log("user connected");

  var client_id = randomString.generate();
  //Set up basic user data
  connected_users[client_id] = {};
  connected_users[client_id]['socket'] = socket;
  connected_users[client_id]['places'] = {};
  connected_users[client_id]['finished-processing-places'] = false;

  socket.on('search-places', function (searchTerm, userLocation) {
    console.log("searching for places: " + searchTerm);
    getNearbyPlaces(client_id, searchTerm, userLocation, function(result) {
      console.log("found places, sending to clients");

      //Get number of clients connected
      // Race condition on number of clients connected
      number_of_clients = 0;
      Object.keys(connected_users).forEach(function (client_id) {
        number_of_clients += 1;
      });

      unfinished_clients = number_of_clients;

      io.sockets.emit('place-results', result);
      console.log(JSON.stringify(result));
    });
  });

  socket.on('image', function(imagedata, place) {
    console.log("received file");
    var image_path = "/images/" + randomString.generate() + ".jpg"
    fs.writeFileSync(__dirname + image_path, imagedata, "binary");
    console.log("saved file");

    // perform sentiment analysis here
    cognitive.cognitive(hostname_url + image_path, handle_emotion(client_id, image_path, place))
  });

  socket.on('disconnect', function () {
    console.log("user disconnect");
    delete connected_users[client_id];
  });
});

var gMapsClient = require('@google/maps').createClient({
  //key: 'AIzaSyDyz2RwNSa3qDRfnclcIgUUWS7Fn5NexfA'
  key: 'AIzaSyDPFxFyh9hvR7OY4bu8ZU7GVKTHY6YCC2s'
});

function getNearbyPlaces(client_id, searchTerm, userLocation, responseHandler) {
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
    // opennow: true,
    radius: 500
  };
  gMapsClient.places(query, function (err, response) {
    var placesArray = response.json['results'];
    // var sortedResults = placesArray.sort(sort_by('rating', true, parseFloat));
    var top3Results = placesArray.slice(0, NUMBER_OF_PLACES);
    Object.keys(connected_users).forEach(function (id) {
      connected_users[id]['number-of-places'] = top3Results.length;
    });
    console.log("found " + top3Results.length + " number of places");
    responseHandler(top3Results);
  });
}

function handle_emotion(client_id, image_path, place) {
  console.log("analysing image " + image_path);
  return function (emotions) {
    //take first emotion
    console.log("got emotions " + JSON.stringify(emotions) + " for image: " + image_path);
    console.log("storing emotions for the images");

    // Store emotions for each image for each socket
    //connected_users[client_id].push([]);
    console.log("these are the connected users: " + JSON.stringify(Object.keys(connected_users)));

    if (connected_users[client_id]['places'][place] == undefined) {
      connected_users[client_id]['places'][place] = []
    }

    if (emotions.length == 0) {
      console.log("couldn't find any emotions for image at: " + image_path + ", place: " + place + ". Giving default score of 0.");
      connected_users[client_id]['places'][place].push(0);
    } else {
      connected_users[client_id]['places'][place].push(calculatePlaceScore(emotions[0]['scores']));
    }

    var totalNumberOfImages = totalImages(connected_users[client_id]['places']);
    console.log("number of images taken so, far " + totalNumberOfImages);
    console.log("number of images we're expecting for each place: " + connected_users[client_id]['number-of-places'] * IMAGES_PER_PLACE);

    if (totalNumberOfImages >= connected_users[client_id]['number-of-places'] * IMAGES_PER_PLACE) {
      // Received all images, choose best image
      // TODO: need all group to submit mages
      // choose place that is most prefered
      // send place back to everyone

      //[{"faceRectangle":{"height":782,"left":754,"top":1172,"wclient_idth":782},
      // "scores":{"anger":0.000006604076,"contempt":0.00376007543,
      // "disgust":0.000002866387,"fear":8.441607e-9,
      // "happiness":0.0143168205,"neutral":0.98168993,
      // "sadness":0.000220218935,"surprise":0.000003459858}}]

      console.log("got " + NUMBER_OF_PLACES + " of places");

      var maxScore = -10;

      //Calculate scores for each place
      var places = connected_users[client_id]['places'];
      connected_users[client_id]['places-score'] = {};
      var places_score = connected_users[client_id]['places-score'];
      Object.keys(places).forEach(function (place) {
        var aggregateScore = 0;
        places[place].forEach(function (score) {
          aggregateScore += score;
        });
        places_score[place] = aggregateScore;
      });

//    for (var i = 0; i < NUMBER_OF_PLACES; i++) {
//      var aggregateScore = 0;
//      Object.keys(connected_users).forEach(function (user) {
//        aggregateScore += connected_users[user][i];
//      });
//      if (aggregateScore > maxScore) {
//        maxScore = aggregateScore;
//        placeclient_id = i;
//      }
//    }

      unfinished_clients_lock.writeLock(function (release) {
        unfinished_clients -= 1;
        console.log("Waiting on " + unfinished_clients + " clients");
        if (unfinished_clients == 0) {
          console.log("No longer waiting on clients");
          //Calculate best image for clients

          max_score = -100;
          max_place = null;

          Object.keys(places).forEach(function (place) {
            aggregate_user_place_score = 0;
            Object.keys(connected_users).forEach(function (client_id) {
              aggregate_user_place_score += connected_users[client_id]['places-score'][place];
            });
            if (aggregate_user_place_score > max_score) {
              max_score = aggregate_user_place_score;
              max_place = place;
            }
          });
          console.log("found highest score at place: " + max_place + ", with score " + max_score);

          io.sockets.emit('best-place', max_place);
        }
        release();
      });
    }
  }
}

function totalImages(places) {
  var total = 0;
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
