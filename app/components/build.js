/** @jsx React.DOM */

var React = require('react')
var Router = require('react-router')
var request = require('superagent')
var markdown = require( "markdown" ).markdown
var gravatar = require('gravatar')
var ansi_up = require('ansi_up')
require('array.prototype.find')
var humanize = require('humanize')
var Build = require('../models/build')
var gerritParameters = require('../../../utils/gerrit-params')

module.exports = React.createClass({
  displayName: 'Build',

  getInitialState() {
    return {
      build: {},
      gerritParameters: {},
      output: null
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.params.buildNumber !== nextProps.params.buildNumber)
      return true

    if(this.props.params.jobName !== nextProps.params.jobName)
      return true

    return false
  },

  componentWillUpdate(nextProps) {
    this.update(nextProps)
  },

  componentDidMount() {
    this.update(this.props)
  },

  update(nextProps) {
    this.getBuild(nextProps)
    this.getOutput(nextProps)
  },

  getBuild(props) {
    Build.findOne(props.params.jobName,props.params.buildNumber).then((build) => {
      this.setState({
        build: build,
        gerritParameters: gerritParameters(build)
      })
    })
  },

  getOutput(props) {
    request.get('/api/jobs/' + props.params.jobName + '/builds/' + props.params.buildNumber + '/output', (error, result) => {
      if(error || !result.body) {
        return
      }
      //this.setState({
      //  output: result.body.output
      //})

      // Dirty
      this.refs['console-output'].getDOMNode().innerHTML = result.body.output
    }) 
  },

  render() {
    var imageUrl = null
    var mug
    if(this.state.gerritParameters.GERRIT_EVENT_ACCOUNT_EMAIL) {
      imageUrl = gravatar.url(this.state.gerritParameters.GERRIT_EVENT_ACCOUNT_EMAIL, {
        s: '70',
        r: 'pg',
        d: 'mm'
      });
      mug = (
        <a href="http://en.gravatar.com/">
          <img key={imageUrl} src={imageUrl} className="leeroy-build-mug" />
        </a>
      )
    }

    var changesetComment = null
    if(this.state.build 
        && this.state.build.changeSet
        && this.state.build.changeSet.items
        && this.state.build.changeSet.items.length) {
      changesetComment = humanize.nl2br(this.state.build.changeSet.items[0].comment)
    }

    var patchSetLink = null
    if(this.state.gerritParameters && this.state.gerritParameters.GERRIT_PROJECT) {
      patchSetLink = (
        <a href={this.state.gerritParameters.GERRIT_CHANGE_URL}>
          {this.state.gerritParameters.GERRIT_PROJECT}/{this.state.gerritParameters.GERRIT_CHANGE_NUMBER}/{this.state.gerritParameters.GERRIT_PATCHSET_NUMBER}
        </a>
      )
    }

    var retryIcon = null
    if(['ABORTED','FAILURE'].indexOf(this.state.build.result) > -1) {
      var retryIcon = (
        <a href="#">
          <img src="/svg/icon-retry.svg" className="leeroy-retry-icon" />
        </a>      
      )
    }

    return (
      <section className="leeroy-build-section">
        <div className="leeroy-detail-toolbar">
          {mug}
          {this.state.gerritParameters.GERRIT_PATCHSET_UPLOADER_NAME}

          <div className="leeroy-build-actions">
            {retryIcon}
          </div>
        </div>

        <div
        className="leeroy-changeset-comment"
        dangerouslySetInnerHTML={{__html: changesetComment}}></div>

        <hr/>

        <div className="leeroy-console-output" ref="console-output"></div>

        {/*<div
        className="leeroy-build-output"
        dangerouslySetInnerHTML={{__html: (this.state.output || '')}}>
        </div>*/}

      </section>
    )
  }
})



