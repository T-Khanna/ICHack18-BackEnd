vat: querystring = require('querystring');
var http = require('http');
var fs = require('fs');

function cognitive(image_url, call_back) {
  var request = require("request");
  var options = {
    method: 'POST',
    url: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
    headers:
    { 'postman-token': '9ee3bd2c-0adc-26d4-be0a-0f7cc61fc977',
      'cache-control': 'no-cache',
      'Ocp-apim-subscription-key': '4bd0a14f6c04421d80749ec0081d89fc',
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
    // TODO: Handle body
    console.log(body);
  });
}

function process_data(data, call_back) {
    console.log(data);
}

function real_process_data(data, call_back) {
    result = [];
    for (var i = 0; i < data.length; i++) {
        var face_data = data[i]
	var emotion =  get_emotion(face_data);
	result.push(emotion);
    }

    call_back(result);
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

image_url = "https://emotion-picker.herokuapp.com/images/yianni.png";
cognitive(image_url, get_emotion);
