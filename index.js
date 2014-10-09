require('dotenv').load()
var express = require('express')
var Job = require('./models/job')
var Build = require('./models/build')

var app = express()

app.get('/api/builds', function(req, res) {
  Build
    .findRecent()
    .then(function(data) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({jobs:data}, null, 2)) 
    }).catch(function(error) {
      res.json('error',error)       
    })
})

app.get('/api/jobs', function(req, res) {
  Job
    .findAll()
    .then(function(data) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({jobs:data}, null, 2))
    })
})

app.get('/api/jobs/:job', function(req, res) {
  Job
    .find(req.params.job)
    .then(function(result) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result, null, 2))
    }).catch(function(error) {
      res.json('error')
    })
})

app.get('/api/jobs/:job/builds/:build', function(req, res){
  Build
    .find(req.params.job, req.params.build)
    .then(function(data) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({builds:data}, null, 2))
    }).catch(function(error) {
      res.json('error')
    })
})

app.get('/api/jobs/:job/builds/:build/output', function(req, res){
  Build.getOutput(req.params.job, req.params.build, function(err, data) {
    if (err) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data, null, 2))
      return console.log(err)
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data, null, 2))
  })
})

app.use(express.static(__dirname + '/dist'))

var server = app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port %d', server.address().port)       
})

