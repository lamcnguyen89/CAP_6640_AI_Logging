import React from 'react'
import { Form } from 'react-bootstrap'

interface radioBtnProps {
    inline?: string;
    disable?: string;
    label?: string;
    id?: string;
    classname?: string
    onchange?: any;
}

const Checkbox: any = (props: radioBtnProps) => {
  return (
    <Form.Check
      label={props.label}
      type="radio"
      id={props.id}
      className={props.classname}
      onChange={props.onchange}
    />
  )
}

export default Checkbox
