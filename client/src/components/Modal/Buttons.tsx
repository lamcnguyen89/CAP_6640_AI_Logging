import React from 'react'
import { Button } from 'react-bootstrap'

interface buttonsProps {
  btncolor?: string;
  text?: string;
  onClick?: any;
  classname?: string;
  variant?: any;
}

const ModalButton2 = (props: buttonsProps) => {
  return (
    <Button style={{ backgroundColor: `${props.btncolor}` }} onClick={props.onClick} className={props.classname} variant={props.variant}>{props.text}</Button>
  )
}

ModalButton2.displayName = 'ModalButton2'
export default ModalButton2
