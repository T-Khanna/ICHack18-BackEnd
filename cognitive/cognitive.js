var querystring = require('querystring');
var http = require('http');
var fs = require('fs');



function cognitive(image_url) {
    
   
    var url = "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize?";
    var sub_key = "4bd0a14f6c04421d80749ec0081d89fc";

    var post_options = {
        host: 'westus.api.cognitive.microsoft.com',
        port: '80',
        path: '/emotion/v1.0/recognize?',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '4bd0a14f6c04421d80749ec0081d89fc'
        }
    };

    var post_data = querystring.stringify({
        'url': image_url
    });

    var post_req = http.request(post_options, process_data(data))

    post_req.write(post_data);

    post_req.end();


/*
    var faceRectangle = data[0].faceRectangle;
    var faceRectangleList = $('#faceRectangle');
    // Get emotion confidence scores
    var scores = data[0].scores;

*/

}

function process_data(data) {
    console.log(data);
}

function real_process_data(data) {
    result = [];
    for (var i = 0; i < data.length; i++) {
        var face_data = data[i]
        face_data
    }
}
