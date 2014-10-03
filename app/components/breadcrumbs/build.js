/** @jsx React.DOM */

var React = require('react')

module.exports = React.createClass({
  displayName: 'BuildJob',

  render() {
    return (
      <span>
        <span className="leeroy-breadcrumb">{this.props.params.buildNumber}</span>
      </span>
    )
  }
})





