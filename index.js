require('dotenv').load()
var express = require('express')
var Job = require('./models/job')
var Build = require('./models/build')
var Promise = require('es6-promise').Promise

var app = express()

app.get('/api/builds/update', function(req, res) {
  Build
    .updateRecent()
    .then(function(builds) {
      res.setHeader('Content-Type', 'application/json')
      res.status(200).end(JSON.stringify({builds:builds}, null, 2))   
    }).catch(function(error) {
      res.status(500).json({error:error})
    })
})

app.get('/api/builds', function(req, res) {
  Build
    .findRecent()
    .then(function(builds) {
      res.setHeader('Content-Type', 'application/json')
      res.status(200).end(JSON.stringify({
        builds: builds,
        meta: {
          count: builds.length
        }
      }, null, 2))   
    }).catch(function(error) {
      res.status(500).json({error:error})
    })
})

app.get('/api/jobs', function(req, res) {
  Job
    .findAll()
    .then(function(data) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({jobs:data}, null, 2)) 
    }).catch(function(error) {
      res.json('error',error)       
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
      console.log('error',error)
      res.json('error')
    })
})

app.get('/api/jobs/:job/builds/:build/output', function(req, res){
  Build.getOutput(req.params.job, parseInt(req.params.build,10)).then(function(data) {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({output: data}, null, 2))
  }).catch(function(err) {
    res.setHeader('Content-Type', 'application/json')
    console.log('failure')
    res.end(JSON.stringify(data, null, 2))
    return console.log(err)
  })
})

app.use(express.static(__dirname + '/dist'))

var server = app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port %d', server.address().port)       
})
