import React, { Component } from 'react'
import { Form } from 'react-bootstrap'

interface props {
    onChange?: any;
    placeholder?: any;
    type?: any;
    size?: any;
    onKeyup?: any;
    items?: Array<any>;
    classname?: string;
    label?: string;
    value?: string;
    multiple?: boolean;
}

class InputForm extends Component<props> {
    getLabel = () => {
      if (this.props.label) {
        return (
          <Form.Label>{this.props.label}</Form.Label>
        )
      }
    }

    render () {
      const props = this.props
      const label = this.getLabel()
      return (
        <Form.Group>
          {label}
          {(props.type !== 'select')
            ? < Form.Control size={props.size} type={props.type} placeholder={props.placeholder} onChange={props.onChange} className={props.classname} value={props.value} onKeyUp={props.onKeyup} />
            : < Form.Control size={props.size} as="select" onChange={this.props.onChange} className={props.classname} multiple={props.multiple} onKeyUp={props.onKeyup}>
              {props.items.map((item:any, index) => (
                <option className={item.classname} key={`option${index}-${item.className}`}>{item.name}</option>
              ))}
            </ Form.Control>
          }
        </Form.Group>
      )
    }
}

export default InputForm
