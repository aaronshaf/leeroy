var jenkinsapi = require('jenkins-api')
var jenkins = jenkinsapi.init(process.env.JENKINS_HOST)
var redisClient = require('./redis-client')
var flatten = require('lodash-node/modern/arrays/flatten')
var shuffle = require('lodash-node/modern/collections/shuffle')
var Promise = require('es6-promise').Promise
var Job = require('./job')
var request = require('superagent')
var db = require('./redis-client')
var mongoose = require('mongoose')
var Mixed = mongoose.Schema.Types.Mixed
mongoose.connect(process.env.MONGO_URL);
var Schema = mongoose.Schema
var sanitizeKeys = require('../utils/sanitize-keys')
var ansi_up = require('ansi_up')
var humanize = require('humanize')

console.log('process.env.JENKINS_HOST',process.env.JENKINS_HOST)

var buildSchema = new Schema({
  jobName: String,
  actions: Mixed,
  building: Boolean,
  duration: Number,
  estimatedDuration: Number,
  fullDisplayName: String,
  jenkinsId: String,
  number: Number,
  result: Mixed, // When not SUCCESS/FAILURE, it is returning an object?
  timestamp: Date,
  url: String,
  builtOn: String,
  changeSet: Mixed,
  output: String,
  updatedAt: { type: Date, default: Date.now }
})
var Build = mongoose.model('Build', buildSchema)

var finishedBuilds = []
var limit = 25

function findRecent() {
  return new Promise(function(resolve, reject) {
    Build.find().select({output: 0}).sort({timestamp:-1}).limit(100).exec(function(error,builds) {
      if(error) {
        return reject(error)
      }
      resolve(builds)
    })
  })
}

function extractBuilds(jobs) {
  var result = jobs.map(function(job) {
    return job.builds.map(function(build) {
      return {jobName: job.name, number: build.number}
    })
  })

  return flatten(result)
}

function unfinished(build) {
  return finishedBuilds.indexOf(build.jobName + ' #' + build.number) === -1
}

function findAllBuilds(builds) {
  return Promise.all(builds.map(function(build) {
    return find(build.jobName,build.number)
  }))
}

function updateRecent() {
  return Job
    .findAll()
    .then(function(jobs) {
      var builds = shuffle(extractBuilds(jobs))
        .filter(unfinished)
        .slice(0,limit)

      return findAllBuilds(builds)
    }).catch(function(error) {
      res.json('error',error)       
    })
}

function findMany(jobName,buildNumbers) {
  return Promise.all(buildNumbers.map(function(buildNumber) {
    return find(jobName,buildNumber)
  }))
}

function isFinished(result) {
  return result && result.result && (result.result !== 'FAILURE' || result.result !== 'SUCCESS')
}

function find(jobName,buildNumber) {
  return new Promise(function(resolve, reject) {
    var parsedResult = {}
    var path = 'jobs/' + jobName + '/builds/' + buildNumber

    Build.findOne({
      jobName: jobName,
      number: buildNumber
    }).select({output: 0}).exec(function(error, result) {
      //if(error || !result) {
      //  reject()
      //} 

      if(!isFinished(result)) {
        jenkins.build_info(jobName,buildNumber,function(error, result) {
          result = sanitizeKeys(result)

          result.jobName = jobName
          result.timestamp = new Date(result.timestamp)

          //db.set(path, JSON.stringify(result), function() {})

          Build.findOneAndUpdate({
            jobName: jobName,
            number: buildNumber
          },result,{upsert:true}, function(error) {
            if(!error) {
              console.log(result.jobName + '/' + result.number + ' successfully saved')
            } else {
              console.log(error)
            }
          })
          if(isFinished(result)) {
            finishedBuilds.push(jobName + ' #' + buildNumber)
          }
          resolve(result)
        })
        getOutputFromJenkins(jobName,buildNumber)
      } else {
        finishedBuilds.push(jobName + ' #' + buildNumber)
        //console.log(path + ' already finished')
        resolve(result)
      }
    })
  })
}

function getOutputFromJenkins(jobName,buildNumber) {
  jenkins.job_output(jobName,buildNumber,function(error, result) {
    var lines
    if(!error && result && result.output) {
      var lines = result.output.split("\n").slice(-200)
      result.output = humanize.nl2br(ansi_up.ansi_to_html(lines.join("\n")))
    }
    //db.set(path, JSON.stringify(result), function() {})

    Build.update({
      jobName: jobName,
      number: buildNumber
    }, {
      output: result.output
    }, {
      upsert: true
    }, function(error, result) {
      //TODO: event emitter
      //console.log(error,result)
    })
  })
}

function getOutput(jobName,buildNumber) {
  return new Promise(function(resolve, reject) {
    var returned = false
    path = 'jobs/' + jobName + '/builds/' + buildNumber + '/output'

    Build.findOne({
      jobName: jobName,
      number: buildNumber
    }).select({
      result: 1,
      output: 1
    }).exec(function(error, result) {
      if(!isFinished(result)) {
        getOutputFromJenkins(jobName,buildNumber)
      }
      resolve(result.output)
    })
  })
}

exports.find = find
exports.findRecent = findRecent
exports.updateRecent = updateRecent
exports.findMany = findMany
exports.getOutput = getOutput

