/** @jsx React.DOM */
var React = require('react')
var Router = require('react-router')
var Link = require('react-router').Link
var request = require('superagent')
var moment = require('moment')
require('array.prototype.find')

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
    request.get('/api/builds', (error, result) => {
      if(error) return
      this.setState({
        builds: result.body.builds.slice(0,50),
        loading: false
      })
    })
  },

  render() {
    var gerritChangeNumbers = []

    var builds = this.state.builds.map((build) => {
      var gerritParameters = {}
      var id
      if(!build.actions || !build.actions.find) {
        return null
      }
      var gerritParameterArray = build.actions.find((element) => {
        if(!element) return false
        return element.parameters
      })
      if(gerritParameterArray) {
        gerritParameterArray = gerritParameterArray.parameters
      
        gerritParameterArray.forEach((param) => {
          gerritParameters[param.name] = param.value                  
        })
      } else {
        return null
      }
      var name = null
      if(gerritParameters.GERRIT_EVENT_ACCOUNT_NAME) {
        name = gerritParameters.GERRIT_EVENT_ACCOUNT_NAME
      }

      id = gerritParameters.GERRIT_CHANGE_NUMBER || build.id
      if(gerritChangeNumbers.indexOf(id) > -1) {
        return null
      }
      gerritChangeNumbers.push(id)

      var className = "leeroy-build-list-item"
      var statusImage = null
      if(build.result === 'SUCCESS') {
        className += 'leeroy-build-success'
        statusImage = <img src="/svg/checkmark.svg" className="leeroy-build-status" />
      } else if(build.result === 'FAILURE') {
        statusImage = <img src="/svg/cross.svg" className="leeroy-build-status" />
      }

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
              {statusImage}
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

