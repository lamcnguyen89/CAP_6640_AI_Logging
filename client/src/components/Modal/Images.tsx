import React from 'react'
import { Image } from 'react-bootstrap'

interface imageProps {
    src?: string;
    fluid?: boolean;
    rounded?: boolean;
    classname?: string;
    thumbnail?: boolean;
    circle?: boolean;
}

const Images: any = (props: imageProps) => {
  return (
    <Image src={props.src} fluid={props.fluid} className={props.classname} thumbnail={props.thumbnail} rounded={props.rounded} roundedCircle={props.circle} />
  )
}

export default Images
