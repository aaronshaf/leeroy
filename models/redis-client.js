var level = require('level')
var redis = require('redis')
var redisClient = require('redis-url').connect()

exports.get = redisClient.get.bind(redisClient)
exports.set = redisClient.set.bind(redisClient)

