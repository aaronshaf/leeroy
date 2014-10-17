/** @jsx React.DOM */

var React = require('react')

module.exports = React.createClass({
  propTypes: {
    build: React.PropTypes.any
  },

  render() {
    var build = this.props.build

    if(!build.building) {
      return null
    }
    
    var currentTime = (new Date()).getTime()
    var startTime = (new Date(build.timestamp)).getTime()
    var progressRatio = (currentTime - startTime) / build.estimatedDuration
    return <progress max="1" value={progressRatio}></progress> 
  }
}) 
