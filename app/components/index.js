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
  var startDate = new Date(build.timestamp)

  if(!isOverdue(build)) {
    if(build.duration && !build.building) {
      time = moment(startDate.getTime() + build.duration).fromNow()
    } else {
      time = moment(build.timestamp).fromNow()
    }
  } else {
    time = moment(startDate.getTime() + build.estimatedDuration).fromNow(true) + ' overdue'
  }

  return <div className="leeroy-build-time">{time}</div>
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
      lastUpdated: moment().format(),
      filterQuery: localStorage.filterQuery
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return true
  },

  componentDidMount() {
    Build.findAll().then((builds) => {
      this.setState({
        builds: builds 
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

  handleFilterQuery() {
    this.setState({
      filterQuery: localStorage.filterQuery = this.refs.filterQuery.getDOMNode().value
    })
  },

  render() {
    var gerritChangeNumbers = new Set()

    var filteredBuilds = this.state.builds.filter((build) => {
      if(!this.state.filterQuery) return true
      if(build.jobName.indexOf(this.state.filterQuery) > -1) return true
      var gerritParameters = extractGerritParameters(build)
      
      return false
    })

    var builds = filteredBuilds.map((build) => {
      var gerritParameters = extractGerritParameters(build)
      var id 
      id = gerritParameters.GERRIT_CHANGE_NUMBER || build.id
      if(gerritChangeNumbers.has(id)) {
        return null
      }
      gerritChangeNumbers.add(id)

      var className = "leeroy-build-list-item"
      var time = getTimeStatus(build)

      var progressBar
      if(build.building && !isOverdue(build)) {
        progressBar = <ProgressBar build={build} />
      }
        
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
          <div className="leeroy-master-column">
            <div className="leeroy-build-filter">
              <input
                  className="leeroy-build-filter-search-input"
                  type="text"
                  ref="filterQuery"
                  onInput={this.handleFilterQuery}
                  defaultValue={localStorage.filterQuery || ''} />
              <img src="/svg/icon-search.svg" className="leeroy-search-icon" />
            </div>
            <ul className="leeroy-build-list">
              {builds}
            </ul>
          </div>
          <this.props.activeRouteHandler/>
        </section>
      </div>
    )
  }
})

