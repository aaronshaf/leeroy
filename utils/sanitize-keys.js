// Adapted from http://stackoverflow.com/a/10196981/176758
function sanitizeKeys(obj) {
  if(typeof obj !== 'object') {
    return obj
  }
  var output = {}
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var newKey = key.replace('.','')
      if (newKey[0] === '$') newKey = newKey.substr(1)
      if(obj[key] instanceof Array) {
        output[newKey] = obj[key].map(sanitizeKeys)
      } else if (typeof obj[key] === 'object') {
        output[newKey] = sanitizeKeys(obj[key])
      } else {
        output[newKey] = obj[key]
      }
    }
  }
  return output
}

module.exports = sanitizeKeys
