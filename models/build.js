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
  result: String,
  timestamp: Date,
  url: String,
  builtOn: String,
  changeSet: Mixed,
  updatedAt: { type: Date, default: Date.now }
})
var Build = mongoose.model('Build', buildSchema)

var finishedBuilds = []
var limit = 500

function findRecent() {
  return new Promise(function(resolve, reject) {
    Build.find().sort({timestamp:-1}).limit(100).exec(function(error,builds) {
      if(error) {
        return reject(error)
      }
      resolve(builds)
    })
  })
}

function updateRecent() {
  return Job
    .findAll()
    .then(function(jobs) {
      var builds = shuffle(flatten(jobs.map(function(job) {
        return job.builds.map(function(build) {
          return {jobName: job.name, number: build.number}
        })
      })).filter(function(build) {
        return finishedBuilds.indexOf(build.jobName + ' #' + build.number) === -1
      })).slice(0,limit)

      var countA = 0
      return Promise.all(builds.map(function(build) {
        return find(build.jobName,build.number)
      }))

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

var times = 0



function find(jobName,buildNumber) {
  return new Promise(function(resolve, reject) {
    //console.log(times++)

    var parsedResult = {}
    var path = 'jobs/' + jobName + '/builds/' + buildNumber

    Build.findOne({
      jobName: jobName,
      number: buildNumber
    }, function(error, result) {
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
          //console.log('resolving: ' + path)
          if(isFinished(result)) {
            finishedBuilds.push(jobName + ' #' + buildNumber)
          }
          resolve(result)
        })
      } else {
        console.log('no?')
        finishedBuilds.push(jobName + ' #' + buildNumber)
        console.log('resolving (cached): ' + path)
        //console.log(times++)
        resolve(result)
      }
    })
  })
}

function getOutput(jobName,buildNumber,callback) {
  var returned = false
  path = 'jobs/' + jobName + '/builds/' + buildNumber + '/output'

  db.get(path, function(error, result) {
    if(!error && !returned) {
      callback(error, JSON.parse(result))
      returned = true
    }
  })

  jenkins.job_output(jobName,buildNumber,function(error, result) {
    if(result && result.output) {
      result.output = ansi_up.ansi_to_html(result.output)
    }
    db.set(path, JSON.stringify(result), function() {})
    if(!returned) {
      callback(error,result)
      returned = true
    }
  })
}

exports.find = find
exports.findRecent = findRecent
exports.updateRecent = updateRecent
exports.findMany = findMany
exports.getOutput = getOutput
