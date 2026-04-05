import React from 'react'
import { Card } from 'react-bootstrap'

interface cardProps {
    title?: string;
    id?: string;
    classname?: string;
    image?: string;
    text?: string;
    idx?: number;
    onClick?: any;
    style?: any;
}

const Cards: any = (props: cardProps) => {
  return (
    <Card key={props.idx} onClick={props.onClick} className={props.classname} id={props.id} style={props.style}>
      <Card.Img variant="top" src={props.image} />
      <Card.Body>
        <Card.Title>{`Title: ${props.title}`}</Card.Title>
        <Card.Text>
          {`Description: ${props.text}`}
        </Card.Text>
      </Card.Body>
    </Card>
  )
}

export default Cards
