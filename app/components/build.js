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
    return true
  },

  componentWillReceiveProps(nextProps) {
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
    //Build.findAll()
    //Bind.subscribe('*',
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
        r: 'pg'
//        d: 'blank'
      });
      mug = <img src={imageUrl} className="leeroy-build-mug" />
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

    return (
      <section className="leeroy-build-section">
        <h1>{patchSetLink}</h1>

        {mug}
        {this.state.gerritParameters.GERRIT_PATCHSET_UPLOADER_NAME}

        <div
        className="leeroy-changeset-comment"
        dangerouslySetInnerHTML={{__html: changesetComment}}></div>

        <div className="leeroy-console-output" ref="console-output"></div>

        {/*<div
        className="leeroy-build-output"
        dangerouslySetInnerHTML={{__html: (this.state.output || '')}}>
        </div>*/}

      </section>
    )
  }
})



