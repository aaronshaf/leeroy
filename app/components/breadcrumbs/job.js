/** @jsx React.DOM */

var React = require('react')
var Link = require('react-router').Link

module.exports = React.createClass({
  displayName: 'BreadcrumbJob',

  render() {
    return (
      <span>
        <Link className="leeroy-breadcrumb" to="breadcrumb-job" params={{jobName: this.props.params.jobName}}>
          {this.props.params.jobName}
        </Link>
        <this.props.activeRouteHandler />
      </span>
    )
  }
})




