/** @jsx React.DOM */
require('array.prototype.find')
var React = require('react')
var Router = require('react-router')
var Link = require('react-router').Link
var request = require('superagent')
var moment = require('moment')
var extractGerritParameters = require('../../../utils/gerrit-params')
var Build = require('../models/build')
var BuildStatusImage = require('./build-status-image')

function hasActions(build) {
  return build.actions && build.actions.find
}

module.exports = React.createClass({
  displayName: 'Builds',

  getInitialState() {
    return {
      builds: [],
      loading: true
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return true
  },

  componentDidMount() {
    Build.findAll().then((result) => {
      if(!this.isMounted()) return
      this.setState({
        builds: result.builds.filter(hasActions),
        loading: false
      })
    })

    Build.subscribe((data) => {
      if(data.builds) {
        this.setState({
          builds: this.state.builds.concat(data.builds)
        })
      }
    })
  },

  render() {
    var gerritChangeNumbers = new Set()

    var builds = this.state.builds.map((build) => {
      var gerritParameters = extractGerritParameters(build)
      var id 
      id = gerritParameters.GERRIT_CHANGE_NUMBER || build.id
      if(gerritChangeNumbers.has(id)) {
        return null
      }
      gerritChangeNumbers.add(id)

      var className = "leeroy-build-list-item"
      var duration = ''
      var minutes
      var seconds
      if(build.duration) {
//        duration = moment
        minutes = Math.floor(moment.duration(build.duration).asMinutes())
        if(minutes) {
          duration = minutes + ' min '
        }
        seconds = Math.floor(moment.duration(build.duration % (60 * 1000)).asSeconds())
        if(seconds) {
          duration += seconds + ' sec '
        }
      }

      return (
        <li key={gerritParameters.GERRIT_CHANGE_NUMBER || build.id} className={className}>
          <Link to="build" className="leeroy-build-link" params={{
            jobName: build.jobName,
            buildNumber: build.number
          }}>
            <div className="leeroy-build-status-column">
              <BuildStatusImage status={build.result} />
            </div>
            <div className="leeroy-build-preview-column">
              <div className="leeroy-build-list-item-title">
                {gerritParameters.GERRIT_CHANGE_SUBJECT || build.fullDisplayName}
              </div>
              <div className="leeroy-build-duration">
                {duration}
              </div>
            </div>
          </Link>
        </li>
      )       
    })

    if(this.state.loading) {
      return (
        <div className="leeroy-layout">
          <section className="leeroy-job-section">
            <ul className="leeroy-build-list">
              <li>Loading...</li>
            </ul>
            <this.props.activeRouteHandler/>
          </section>
        </div>
      )
    }

    return (
      <div className="leeroy-layout">
        <section className="leeroy-job-section">
          <ul className="leeroy-build-list">
            {builds}
          </ul>
          <this.props.activeRouteHandler/>
        </section>
      </div>
    )
  }
})

