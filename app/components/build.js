/** @jsx React.DOM */

var React = require('react')
var Router = require('react-router')
var request = require('superagent')
var markdown = require( "markdown" ).markdown
var gravatar = require('gravatar')
var ansi_up = require('ansi_up')
require('array.prototype.find')
var humanize = require('humanize')

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

//  componentDidMount() {
    //this.update(this.props)
//  },

  update(nextProps) {
    this.getBuild(nextProps)
    this.getOutput(nextProps)
  },

  getBuild(props) {
    console.log('getBuild')
    request.get('/api/jobs/' + props.params.jobName + '/builds/' + props.params.buildNumber, (error, result) => {
      if(error || !result.body) {
        console.log('Why is this being called twice?')
        return
      }

      var gerritParameterObject = result.body.builds.actions.find((element) => {
        if(!element) return false
        return element.parameters
      })
      var gerritParameterArray = []
      if(gerritParameterObject && gerritParameterObject.parameters) {
        gerritParameterArray = gerritParameterObject.parameters
      }
      var gerritParameters = {}
      gerritParameterArray.forEach((param) => {
        gerritParameters[param.name] = param.value                  
      })
//      console.log(JSON.stringify(result.body,null,2))

      console.log({gerritParameters})
      this.setState({
        build: result.body.builds,
        gerritParameters: gerritParameters
      })
    })

  },

  getOutput(props) {
    request.get('/api/jobs/' + props.params.jobName + '/builds/' + props.params.buildNumber + '/output', (error, result) => {
      if(error || !result.body) {
        console.log(error,result)
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
    console.log('render',this.state.gerritParameters)
    
    var imageUrl = null
    if(this.state.gerritParameters.GERRIT_EVENT_ACCOUNT_EMAIL) {
      imageUrl = gravatar.url(this.state.gerritParameters.GERRIT_EVENT_ACCOUNT_EMAIL, {s: '60', r: 'pg'});
    }

    var changesetComment = null
    if(this.state.build 
        && this.state.build.changeSet
        && this.state.build.changeSet.items
        && this.state.build.changeSet.items.length) {
      changesetComment = humanize.nl2br(this.state.build.changeSet.items[0].comment)
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

        <div className="leeroy-console-output" ref="console-output"></div>

        {/*<div
        className="leeroy-build-output"
        dangerouslySetInnerHTML={{__html: (this.state.output || '')}}>
        </div>*/}

      </section>
    )
  }
})



