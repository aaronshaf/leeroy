/** @jsx React.DOM */

var React = require('react')

module.exports = React.createClass({
  propTypes: {
    status: React.PropTypes.string
  },
  
  render() {
    var statusImgSrc
    switch(this.props.status) {
      case 'SUCCESS':
        statusImgSrc = '/svg/icon-check.svg'
        break
      case 'FAILURE':
        statusImgSrc = '/svg/icon-x.svg'
        break
      case 'ABORTED':
        statusImgSrc = '/svg/icon-abort.svg'
        break
      default:
        return null
    }
    return <img src={statusImgSrc} className="leeroy-build-status" />
  }
})
