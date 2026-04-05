import React from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'

interface dropdownProps {
  title?: string
  id?: string
  items?: Array<any>
  drop?: "left" | "right" | "up" | "down"
  size?: "sm" | "lg"
  classname?: string
  onSelect?: any
}

const DropdownBtn: any = (props: dropdownProps) => {
  console.log(props)
  return (
    <DropdownButton id={props.id} title={props.title} drop={props.drop} size={props.size} className={props.classname} onSelect={props.onSelect} style={{ display: 'flex' }}>
      {props.items.map((item: any, idx: any) => (
        <Dropdown.Item as="button" key={item.name} eventKey={idx} className={item.classname}> {item} </Dropdown.Item>
      ))}
    </DropdownButton>
  )
}

export default DropdownBtn
