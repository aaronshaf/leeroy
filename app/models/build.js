var Promise = require('es6-promise').Promise
var request = require('superagent')
var source = new EventSource('/api/builds/stream')
var Map = require('immutable').Map

var buildMap = Map().asMutable()

source.addEventListener('open', function(e) {
  console.log('Connection was opened.')
}, false)

source.addEventListener('error', function(e) {
  console.log('EventSource error',e)
}, false)

function hasActions(build) {
  return build.actions && build.actions.find
}

function key(build) {
  return build.jobName + '-' + build.number
}

function isValidBuild(build) {
  return hasActions(build)
}

function addBuild(build) {
  if(!isValidBuild(build)) return
  buildMap.set(key(build),build)
}

function compareBuilds(a,b) {
  if(a.timestamp > b.timestamp) return -1
  return 1
}

function getBuilds() {
  return buildMap.sort(compareBuilds).toArray()
}

var Build = {
  findAll() {
    return new Promise((resolve, reject) => {
      request.get('/api/builds', (error, result) => {
        if(error) return reject(error)
        result.body.builds.forEach(addBuild)
        resolve(getBuilds())
      }) 
    })
  },

  findOne(jobName,buildNumber) {
    return new Promise((resolve, reject) => {
      request.get('/api/jobs/' + jobName + '/builds/' + buildNumber, (error, result) => {
        if(error || !result.body) return reject(error)
        addBuild(result.body.builds)
        resolve(result.body.builds)
      })
    })
  },

  subscribe(callback) {
    source.addEventListener('message', function(e) {
      var build = JSON.parse(e.data)
      addBuild(build)
      callback(getBuilds())
    }, false)
  }
}

module.exports = Build

