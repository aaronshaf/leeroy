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
var stream = require('../utils/stream')

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
      filterQuery: localStorage.filterQuery,
      connectionStatus: false
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

    stream.addEventListener('open', () => {
      this.setState({connectionStatus: true})
    })

    stream.addEventListener('error', () => {
      console.log('error')
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
      var query = this.state.filterQuery.toLowerCase()
    
      if(build.jobName.indexOf(query) > -1) return true

      var gerritParameters = extractGerritParameters(build)

      var parametersToWatch = [
        'GERRIT_CHANGE_SUBJECT',
        'GERRIT_EVENT_ACCOUNT_EMAIL',
        'GERRIT_PATCHSET_UPLOADER_NAME'
      ]
      var param
      for(param of parametersToWatch) {
        if(gerritParameters[param]
            && gerritParameters[param].toLowerCase().indexOf(query) > -1)
          return true 
      }

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

    // var connectedIcon = <img alt="Connected" src="/svg/icon-cloud.svg" className="leeroy-search-icon" /> 
    var disconnectedIcon = <img alt="Connected" src="/svg/icon-cloud-off.svg" className="leeroy-search-icon" /> 
    var connectionStatusIcon = this.state.connectionStatus ? null : disconnectedIcon

    return (
      <div className="leeroy-layout">
        <section className="leeroy-job-section">
          <div className="leeroy-master-column">
            <div className="leeroy-build-filter">
              <input
                  placeholder="Leeroy"
                  className="leeroy-build-filter-search-input"
                  type="text"
                  ref="filterQuery"
                  onInput={this.handleFilterQuery}
                  defaultValue={localStorage.filterQuery || ''} />
              {connectionStatusIcon}
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

