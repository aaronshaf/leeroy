var Promise = require('es6-promise').Promise
var request = require('superagent')
var source = new EventSource('/api/builds/stream')

source.addEventListener('open', function(e) {
  console.log('Connection was opened.')
}, false)

source.addEventListener('error', function(e) {
  console.log('EventSource error',e)
}, false)

var Build = {
  findAll() {
    return new Promise((resolve, reject) => {
      request.get('/api/builds', (error, result) => {
        if(error) return reject(reror)
        resolve(result.body)
      }) 
    })
  },

  findOne(jobName,buildNumber) {
    return new Promise((resolve, reject) => {
      request.get('/api/jobs/' + jobName + '/builds/' + buildNumber, (error, result) => {
        if(error || !result.body) return reject(error)
        resolve(result.body.builds)
      })
    })
  },

  subscribe(callback) {
    source.addEventListener('message', function(e) {
      var data = JSON.parse(e.data)
      callback(data)
    }, false)
  }
}

module.exports = Build

