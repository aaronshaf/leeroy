/** @jsx React.DOM */

var React = require('react')
var Route = require('react-router').Route
var Routes = require('react-router').Routes
var Link = require('react-router').Link
var request = require('superagent')

module.exports = React.createClass({
  displayName: 'Index',

  getInitialState() {
    return {
      jobs: []
    }
  },

  old() {
    <Routes>
      <Route
          path="/"
          name="breadcrumb-index"
          handler={require('./breadcrumbs/index')}>
        <Route name="breadcrumb-job"
            path="/jobs/:jobName"
            handler={require('./breadcrumbs/job')}>
          
          <Route name="breadcrumb-build"
              path="/jobs/:jobName/build/:buildNumber"
              handler={require('./breadcrumbs/build')} />

        </Route>
      </Route>
    </Routes>
  },

  render() {
    return (
      <div className="leeroy-layout">
        <div className="leeroy-breadcrumbs-container">
          <Link to="index">Leeroy</Link>
        </div>
        <this.props.activeRouteHandler />
      </div>
    )
  }
})

