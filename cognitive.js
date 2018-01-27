vat: querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var axios = require('axios');


function cognitive_axios(image_url, call_back) {

	axios({
		method:'post',
		url: 'http://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
		data: { 'url': "https://emotion-picker.herokuapp.com/images/yianni.png"}
	}).then(function(response) {console.log(response.data)}).catch(function(err) {console.log(err.msg)});

}

function cognitive_request() {


var request = require("request");

var options = { method: 'POST',
	  url: 'http://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
	  headers:
		{ 'postman-token': '9ee3bd2c-0adc-26d4-be0a-0f7cc61fc977',
		  'cache-control': 'no-cache',
	  	  'ocp-apim-subscription-key': '4bd0a14f6c04421d80749ec0081d89fc',
	 	  'content-type': 'application/json'
		},
	  body: { url: 'https://emotion-picker.herokuapp.com/images/yianni.png' },
	        json: true };

request(options, function (error, response, body) {
	  if (error) throw new Error(error);

	    console.log(body);
});

}


function cognitive(image_url, call_back) {

    var url = "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize?";
    var sub_key = '4bd0a14f6c04421d80749ec0081d89fc';

    var post_options = {
        host: 'westus.api.cognitive.microsoft.com',
        path: '/emotion/v1.0/recognize',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': sub_key
        }
    };


    post_data = JSON.stringify({'url': image_url});

    console.log(post_data);

    var post_req = http.request(post_options, function(res) {
	   // console.log(res.statusCode);
//	    console.log(res);
	    res.setEncoding('utf8');
	    console.log("RESPONSEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
	    res.on('data', function(data) {
		    console.log(data)
	    });
	    //process_data(res, call_back);
    });


    post_req.write(post_data);

    console.log(post_req)

    post_req.end();
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

//cognitive(image_url, get_emotion);

//cognitive_axios(image_url, get_emotion);
cognitive_request();
