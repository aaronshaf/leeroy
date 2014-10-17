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
var ProgressBar = require('./progress-bar')

function getTimeStatus(build) {
  var time = ''

  if(!build.timestamp) return null

  if(build.duration && !build.building) {
    var startDate = new Date(build.timestamp)
    time = moment(startDate.getTime() + build.duration).fromNow()
  } else {
    time = moment(build.timestamp).fromNow()
  }

  return <div className="leeroy-build-time">{time}</div>

  /*
  var minutes
  var seconds
  if(build.duration) {
    minutes = Math.floor(moment.duration(build.duration).asMinutes())
    if(minutes) {
      time = minutes + ' min '
    }
    seconds = Math.floor(moment.duration(build.duration % (60 * 1000)).asSeconds())
    if(seconds) {
      time += seconds + ' sec '
    }
  }
  return time
  */
}

function isOverdue(build) {
  if(!build.building) return false
  return (new Date()).getTime() > (new Date(build.timestamp)).getTime() + build.estimatedDuration
}

module.exports = React.createClass({
  displayName: 'Builds',

  getInitialState() {
    return {
      builds: [],
      lastUpdated: moment().format()
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return true
  },

  componentDidMount() {
    Build.findAll().then((builds) => {
      this.setState({
        builds: builds //result.builds.filter(hasActions),
      })
    })

    Build.subscribe((data) => {
      this.setState({
        lastUpdated: moment().format()
      })
      if(!data.builds) return null
      this.setState({
        builds: this.state.builds.concat(data.builds)
      })
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
      var time = getTimeStatus(build)
      var progressBar = !isOverdue(build) ? <ProgressBar build={build} /> : null
      var key = build.jobName + '-' + build.number

      return (
        <li key={key} className={className}>
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
              {progressBar}
              {time}
            </div>
          </Link>
        </li>
      )       
    })

    if(!this.state.builds.length) {
      return (
        <div className="leeroy-layout">
          <section className="leeroy-job-section">
            <ul className="leeroy-build-list">
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
            <div className="leeroy-last-updated">{this.state.lastUpdated}</div>
            {builds}
          </ul>
          <this.props.activeRouteHandler/>
        </section>
      </div>
    )
  }
})

