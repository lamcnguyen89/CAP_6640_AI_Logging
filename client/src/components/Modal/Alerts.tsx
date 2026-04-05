import React, { Component } from 'react'
import { Alert } from 'react-bootstrap'

interface props {
    showAlert?: any;
    text?: string;
    heading?: string;
    variant?: any;
    classname?: string;
}

class Alerts extends Component<props> {
    getHeading = () => {
      if (this.props.heading) { return <Alert.Heading>{this.props.heading}</Alert.Heading> }
    }

    render () {
      const props = this.props
      const heading = this.getHeading()
      return (
        <Alert show={props.showAlert} variant={props.variant} className={props.classname} style={{ margin: 0 }} >
          {heading}
          <p style={{ margin: 0 }}>
            {this.props.text}
          </p>
        </Alert>
      )
    }
}

export default Alerts
