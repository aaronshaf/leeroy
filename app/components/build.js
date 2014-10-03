/** @jsx React.DOM */

var React = require('react')
var Router = require('react-router')
var request = require('superagent')
var markdown = require( "markdown" ).markdown
var gravatar = require('gravatar')
var ansi_up = require('ansi_up')
require('array.prototype.find')

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
    this.setState({
    })

    request.get('/api/jobs/' + nextProps.params.jobName + '/builds/' + nextProps.params.buildNumber, (error, result) => {
      if(error || !result.body) return

      var gerritParameterArray = result.body.builds.actions.find((element) => element.parameters).parameters
      var gerritParameters = {}
      gerritParameterArray.forEach((param) => {
        gerritParameters[param.name] = param.value                  
      })
//      console.log(JSON.stringify(result.body,null,2))

      this.setState({
        build: result.body.builds,
        gerritParameters: gerritParameters
      })
    })

    request.get('/api/jobs/' + nextProps.params.jobName + '/builds/' + nextProps.params.buildNumber + '/output', (error, result) => {
      console.log(error,result)
      this.setState({
        output: result.body.output
      })
    })
  },

  render() {
    var imageUrl = null
    if(this.state.gerritParameters.GERRIT_EVENT_ACCOUNT_EMAIL) {
      imageUrl = gravatar.url(this.state.gerritParameters.GERRIT_EVENT_ACCOUNT_EMAIL, {s: '60', r: 'pg'});
    }

    var changesetComment = null
    if(this.state.build
        && this.state.build.changeSet
        && this.state.build.changeSet.items) {
      changesetComment = markdown.toHTML(this.state.build.changeSet.items[0].comment)
    }
    return (
      <section className="leeroy-build-section">
        <h1>
          <a href={this.state.gerritParameters.GERRIT_CHANGE_URL}>
            {this.state.gerritParameters.GERRIT_PROJECT}/{this.state.gerritParameters.GERRIT_CHANGE_NUMBER}/{this.state.gerritParameters.GERRIT_PATCHSET_NUMBER}
          </a>
        </h1>

        <img src={imageUrl} className="leeroy-build-mug" />
        {this.state.gerritParameters.GERRIT_CHANGE_OWNER_NAME}

        <div
        className="leeroy-changeset-comment"
        dangerouslySetInnerHTML={{__html: changesetComment}}></div>

        <div
        className="leeroy-build-output"
        dangerouslySetInnerHTML={{__html: ansi_up.ansi_to_html(this.state.output || '')}}>
        </div>
      </section>
    )
  }
})



