var querystring = require('querystring');
var http = require('http');
var fs = require('fs');

function cognitive(image_url, call_back) {
  var request = require("request");
  var options = {
    method: 'POST',
    url: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
    headers:
    { 
      'cache-control': 'no-cache',
      // 'Ocp-apim-subscription-key': '4bd0a14f6c04421d80749ec0081d89fc',
      'Ocp-apim-subscription-key': '59cc08cfa1984838bb89ce5664159fe2',
      'content-type': 'application/json'
    },
    body:
    {
      url: image_url
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    process_data(body, call_back);
  });
}


function process_data(data, call_back) {
    call_back(data);
}

function get_emotion(face_data) {
	var scores = face_data['scores'];
	var max = 0;
	var emotion = "";

	for (var key in scores) {
		if (scores[key] > max) {
			max = scores[key];
			emotion = key;
		}
	}

	return key;
}

function print_res(result) {
	console.log(result);
}

module.exports.cognitive = cognitive;
