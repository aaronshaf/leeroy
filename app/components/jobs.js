/** @jsx React.DOM */

var React = require('react')
var Link = require('react-router').Link
var request = require('superagent')

module.exports = React.createClass({
  displayName: 'Index',

  getInitialState() {
    return {
      jobs: []
    }
  },

  componentDidMount() {
    request.get('/api/jobs', (error, result) => {
      if(error) return
      this.setState({jobs:result.body.jobs.filter((job) => {
        return job.color !== 'disabled' && job.color !== 'notbuilt'
      })})
    })
  },

  render() {
    var jobs = this.state.jobs.map((job) => {
      return (
        <li key={job.name}>
          <Link to="job" className="leeroy-job-link" params={{jobName: job.name}}>
            {job.name}
          </Link>
        </li>
      )       
    })

    return (
      <ul className="leeroy-jobs-list">
        {jobs}
      </ul>
    )
  }
})


