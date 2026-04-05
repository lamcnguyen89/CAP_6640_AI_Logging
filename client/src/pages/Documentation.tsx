import React, { useState, useRef } from "react"
import NavMenu from "../components/NavMenu"
import {
  Container, Button, Input, Table, Modal, ModalHeader, ButtonGroup, ModalFooter, ModalBody
} from 'reactstrap'

import { HashRouter, useParams } from 'react-router-dom'

const Documentation = () => {
console.log("Loading")
  type DocumentationPageParams = {
    page: string
  }
  const param = useParams<DocumentationPageParams>()
  let page = param.page;
  console.log(page)
  if (page == "quickstart") {
    page = "sections/quickstart"
  } else {
    page = undefined
  }
  return (<>
    <NavMenu title={"Documentation"} />
    <iframe style={{ width: "100%", height: "92.5vh" }} src={`${import.meta.env.BASE_URL}/static/docs/`+(page??"index")+".html"} />
  </>
  )
} 
export default Documentation