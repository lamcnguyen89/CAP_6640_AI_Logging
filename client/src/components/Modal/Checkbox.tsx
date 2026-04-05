import React from 'react'
import { Form } from 'react-bootstrap'

interface checkboxProps {
  inline?: boolean
  disable?: boolean
  label?: string
  key?: any
  classname?: string
  onChange?: any
  checked?: boolean
  id?: string
}

const Checkbox: any = (props: checkboxProps) => {
  return (
    <Form.Check
      inline={props.inline}
      disabled={props.disable}
      label={props.label}
      type="checkbox"
      defaultChecked={props.checked}
      className={props.classname}
      onChange={props.onChange}
      id={props.id}
    // checked={props.checked}
    />
  )
}

export default Checkbox
