#!/usr/bin/env node

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var port = process.env.PORT || '5000';
app.listen(port, function () {
  console.log('Listening on port ' + port);
});

// Starting page upon loading the web app
app.get('/', function(req, res) {
  res.render('index', { title: 'App X Server' });
});

module.exports = app;