import React, { Component } from 'react'
import { Toast, Button } from 'react-bootstrap'
import '../styles/App.css'


interface toastProps {
  visible: boolean
  changeState: any
  header:any
  message:any
  toggleVisibility: any
  toastTitle: any
}

export default class ToastNotification extends Component<toastProps> {
  render() {
    return (
      <Toast show={this.props.visible} onClose={this.props.changeState} delay={20}
        style={{
          position: 'absolute',
          top: 0,
          right: 0
        }}>
        <Toast.Header className="text-center" closeButton={false}>
          <strong className="me-auto" style={{ fontSize: '18px' }}>{this.props.toastTitle}</strong>    
        </Toast.Header>
        <Toast.Body className="text-center" style={{ fontSize: '16px', color: 'black' }}>
          <p>{this.props.message}</p>
          <Button className="toast-button" onClick={this.props.toggleVisibility}>Okay</Button>
        </Toast.Body>
        
      </Toast>

    )
  }
}


