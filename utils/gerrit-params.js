function gerritParameters(build) {
  if(!build || !build.actions || !build.actions.length) return {}
  
  var gerritParameters = {}
  var gerritParameterObject = build.actions.find((element) => {
    if(!element) return false
    return element.parameters
  })
  if(gerritParameterObject) {
    gerritParameterObject.parameters.forEach((param) => {
      gerritParameters[param.name] = param.value                  
    })
  } else {
    return {}
  }
  return gerritParameters
}

module.exports = gerritParameters
