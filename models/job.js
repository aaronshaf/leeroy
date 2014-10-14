var jenkinsapi = require('jenkins-api')
var jenkins = jenkinsapi.init(process.env.JENKINS_HOST)
var Promise = require('es6-promise').Promise
var redisClient = require('./redis-client')
var Build = require('./build')
var request = require('superagent')

function findAll() {
  return new Promise(function(resolve, reject) {
    request.get(process.env.JENKINS_HOST + '/api/json?wrapper=jobs&pretty=true&tree=jobs%5Bname,url,color,builds%5Bnumber%5D%5D', function(error,result) {
      if(!error && result) {
        resolve(result.body.jobs)
      } else {
        reject(error)
      }
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

    redisClient.get(jobName, function(error, result) {
      var parsedResult = {}
      try {
        parsedResult = JSON.parse(result)
      } catch(error) {
        console.log('error',error)
        reject()
      }
      if(!error && parsedResult) {
        resolve(parsedResult)
      }
//      if(!error && result) {
//        attachBuilds(jobName,result).then(resolve)
//      }

      jenkins.job_info(jobName,function(error, result) {
//        attachBuilds(jobName,result).then(resolve)
        redisClient.set(path, JSON.stringify(result), function() {})
        resolve(result)
      })
    })
  })
}

exports.findAll = findAll
exports.find = find

