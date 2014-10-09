var jenkinsapi = require('jenkins-api')
var jenkins = jenkinsapi.init(process.env.JENKINS_HOST)
var db = require('./db')
var Promise = require('es6-promise').Promise
var Job = require('./job')
var request = require('superagent')

console.log('process.env.JENKINS_HOST',process.env.JENKINS_HOST)

function findRecent() {
  return new Promise(function(resolve, reject) {
    request.get(process.env.JENKINS_HOST + '/api/json?wrapper=jobs&pretty=true&tree=jobs%5Bname,color,builds%5Bnumber%5D%5D', function(error,result) {
      if(!error && result) {
        resolve(result.body.jobs)
      } else {
        reject(error)
      }
    })
  })
}

function findMany(jobName,buildNumbers) {
  return Promise.all(buildNumbers.map(function(buildNumber) {
    return find(jobName,buildNumber)
  }))
}

function find(jobName,buildNumber) {
  return new Promise(function(resolve, reject) {
    path = 'jobs/' + jobName + '/builds/' + buildNumber

    db.get(path, function(error, result) {
      if(!error && result) {
        resolve(JSON.parse(result))
      }

      jenkins.build_info(jobName,buildNumber,function(error, result) {
        db.put(path, JSON.stringify(result), function() {})
        resolve(result)
      })
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
    db.put(path, JSON.stringify(result), function() {})
    if(!returned) {
      callback(error,result)
      returned = true
    }
  })
}

exports.findRecent = findRecent
exports.find = find
exports.findMany = findMany
exports.getOutput = getOutput
