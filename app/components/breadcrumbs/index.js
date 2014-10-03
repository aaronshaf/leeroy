/** @jsx React.DOM */

var React = require('react')
var Link = require('react-router').Link

module.exports = React.createClass({
  displayName: 'BreadcrumbIndex',

  render() {
    return (
      <span>
        <Link className="leeroy-breadcrumb" to="breadcrumb-index">Jenkins</Link>
        <this.props.activeRouteHandler />
      </span>
    )
  }
})





