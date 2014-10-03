var jenkinsapi = require('jenkins-api')
var jenkins = jenkinsapi.init(process.env.JENKINS_HOST)
var Promise = require('es6-promise').Promise
var db = require('./db')
var Build = require('./build')

function findAll() {
  return new Promise(function(resolve, reject) {
    db.get('jobs', function(error, result) {
      if(!error && result) {
        resolve(JSON.parse(result))
      }

      jenkins.all_jobs(function(error, result) {
        db.put('jobs', JSON.stringify(result), function() {})
        resolve(result)
      })
    })
  })
}

function attachBuilds(jobName,jobResult) {
  return new Promise(function(resolve, reject) {
    var buildNumbers = jobResult.builds.map(function(build) {
      return build.number
    })
    Build.findMany(jobName,buildNumbers)
      .then(function(builds) {
        resolve({
          jobs: jobResult,
          linked: {
            builds: builds
          }      
        })    
      })
  })
}

function find(jobName) {
  return new Promise(function(resolve, reject) {
    var path = 'jobs/' + jobName

    db.get(path, function(error, result) {
      if(!error && result) {
        attachBuilds(jobName,result).then(resolve)
      }

      jenkins.job_info(jobName,function(error, result) {
        attachBuilds(jobName,result).then(resolve)
        db.put(path, JSON.stringify(result), function() {})
      })
    })
  })
}

exports.findAll = findAll
exports.find = find
