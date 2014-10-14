/** @jsx React.DOM */

var React = require('react')
var Route = require('react-router').Route
var DefaultRoute = require('react-router').DefaultRoute
var Routes = require('react-router').Routes

var App = React.createClass({
  render: function () {
    return (
      <div>
        <div id="screenreader-announcements-polite" aria-live="polite"></div>
        <div id="screenreader-announcements-assertive" aria-live="assertive"></div>
        <this.props.activeRouteHandler />
      </div>
    )
  }
})

var routes = (
  <Routes>
    <Route handler={App}>
      <Route
      name="index"
      path="/"
      handler={require('./components/index')}>
      
        <Route
        name="build"
        path="/jobs/:jobName/builds/:buildNumber"
        handler={require('./components/build')} />

      </Route>
    </Route>
  </Routes>
)

module.exports = routes

