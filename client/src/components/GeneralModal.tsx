import React, { Component } from "react";
import { Modal, Row, Col, Container, Button } from "react-bootstrap";

// components
import InputForm from "./Modal/InputForm";
import Checkbox from "./Modal/Checkbox";
import RadioBtn from "./Modal/RadioBtn";
import DropdownBtn from "./Modal/DropdownBtn";
import Cards from "./Modal/Cards";
import Images from "./Modal/Images";
import Paginations from "./Modal/Paginations";
import Alerts from "./Modal/Alerts";

interface ModalProps {
  // these props are required to control the modal appering/disappering
  showModal: boolean;
  toggleModal: any;

  //  optional props for the size of the modal, and each part of the modal
  header?: any;
  row1?: Array<any>;
  row2?: Array<any>;
  row3?: Array<any>;
  row4?: Array<any>;
  footer?: Array<any>;
  size?: any;
}

// - The GeneralModal Component is used to create various Modal configuraitions by just passing it
//   Object Literals as props, each representing the part of the Modal you want to use, and what to put into it.

// - The Modal is divided into 3 Main parts: header, body & footer
// - the body of the Modal is also further divided into 3 subparts: row1, row2 & row3
// - therefore creating this visual
//   - header
//   - body
//    - row1
//    - row2
//    - row3
//   - footer

// - if you want to add an html element into one of the parts, the object must state which kind of element it
//   is for example if it's a textbox, button, card, etc... the getElement() method shows all the supported elements
//   and explaings how to use them

// - header will take in an object with the "title" and "extras" attribute
//    - title  : sets the title of modal header
//    - extras : an array[] of objects for any other elements you want to include in the header

// - so for example if you want to put a button into the footer of the modal, as well as a title and button in the header,
//   you would pass in the props:
//    -header = {
//          title:"My New Modal",
//          extras: [
//                {element:"button", text: "Some Random Btn", col: 2, variant: "secondary", onClick: this.doSomethingRandom}
//              ]
//        }
//    -footer = {element:"button", text: "example button", col: 2, variant: "primary", onClick: this.doSomething}

// - some elements accept a "variant" property, that's used to change the color of the element. you can refer to
//   https://react-bootstrap.netlify.com/components/buttons/#examples for a visual.

// - as a quick a quick reference, these are the variant's and the color they represent
//   - primary: blue
//   - secondary: dark grey
//   - success: green
//   - warning: mustard yellow
//   - danger: red-ish
//   - info: turquoise
//   - light: white
//   - dark: black
//   - link: buttons looks like a link

export default class GeneralModal extends Component<ModalProps> {
  // - determines what elements to use, and renders them inside of a Bootstrap column. The size of the column
  //   is 12 by default, but you can change the size by givin the object the "col" attribute with the desired value.

  // - all elements execpt for "textbox" are rendered inside of a flexbox column and can take advantage full advantage of flexbox styling.
  // - you can also set the className of the columns by passing in the attribute "classname" with the classNames you wish to set

  // - reference each individual Modal Component for a more in-depth understanding, as well as the reference link on each element
  //   to better understand the props being passed onto them
  getElement = (element: any, idx: any) => {
    switch (element.element) {
      case "textbox":
        // - https://react-bootstrap.netlify.com/components/forms/#forms

        // - if you pass it a "label" attribute, the form will have a label with the string value that belonged to the "label" attribute
        // - you can pass it an "onChange" attribute containing a function to execute, during the  onChange() event
        // - you can pass it a "onKeyUp" attribute containing a function to execute during the onKeyUp() event.
        //   useful when wanting to submit on Enter
        return (
          <Col
            xs={element.col ? element.col : 12}
            className={element.classname}
            key={idx}
          >
            <InputForm
              type={element.type}
              placeholder={element.placeholder}
              size={element.size}
              onChange={element.onChange}
              items={element.items}
              multiple={element.multiple}
              classname={element.classname}
              value={element.value}
              label={element.label}
            />
          </Col>
        );
      case "checkbox":
        // - https://react-bootstrap.netlify.com/components/input-group/#input-group-checkboxes

        // - you can pass it an "onChange" attribute containing a function to execute, during the  onChange() event
        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col ${element.containerclass}`}
          >
            <Checkbox
              label={element.label}
              id={element.id}
              classname={element.classname}
              onChange={element.onChange}
              checked={element.checked}
            />
          </Col>
        );
      case "radio":
        return (
          // - https://react-bootstrap.netlify.com/components/input-group/#input-group-checkboxes

          // - you can pass it an "onChange" attribute containing a function to execute, during the  onChange() event
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col  ${element.containerclass}`}
          >
            <RadioBtn
              label={element.label}
              id={element.id}
              classname={element.classname}
              onChange={element.onChange}
            />
          </Col>
        );
      case "button":
        // - https://react-bootstrap.netlify.com/components/buttons/#buttons

        // - you can pass it an "onClick" attribute containing a function to execute, during the  onClick() event
        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col  ${element.containerclass}`}
          >
            <Button onClick={element.onClick} variant={element.variant}>
              {element.text}
            </Button>
          </Col>
        );
      case "dropdown":
        console.log(element);
        // - https://react-bootstrap.netlify.com/components/dropdowns/#dropdowns

        // - to give the dropDown, items inside of it, you have to pass it the "items" attribute.
        //   "items" will be an array[] of objects, with each object able to take in this attributes:
        //    - "name"    : what the text of the item will be
        //    - "onClick"   : function to execute during onClick() event
        //    - "classname" : a className you want to give the item
        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col  ${element.containerclass}`}
          >
            <DropdownBtn
              title={element.title}
              id={element.id}
              onSelect={element.onSelect}
              items={element.items}
              drop={element.drop}
              size={element.size}
              classname={element.classname}
            />
            {/* <p>hello weolrd</p> */}
          </Col>
        );
      case "card":
        // - https://react-bootstrap.netlify.com/components/cards/#cards

        // - you can pass it an "onClick" attribute containing a function to execute, during the  onClick() event
        // - you can pass it an "image" attribute, to give the card and image, and the location of the image can be set
        //   with the "variant" attribute:
        //    - "top"     : sets image on the top of the card, similar to a header
        //    - "bottom"  : sets image at the bottom of the card, similar to a footer
        // - to embed an image into the card, pass in the "embed" attribute as "true"
        //   embed={true}
        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col ${element.containerclass}`}
          >
            <Cards
              title={element.title}
              id={element.id}
              variant={element.variant}
              classname={element.classname}
              text={element.text}
              idx={element.idx}
              onClick={element.onClick}
              image={element.image}
              style={element.style}
              embedImg={element.embed}
            />
          </Col>
        );
      case "p":
        // - you can pass it a "fontSize" attribute, to set the font size
        // - you can pass it the "fontWeight" attribute, to set the font weight
        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col ${element.containerclass}`}
          >
            <p
              className={element.classname}
              id={element.id}
              style={{
                fontSize: element.fontSize,
                fontWeight: element.fontWeight,
              }}
            >
              {element.text}
            </p>
          </Col>
        );
      case "image":
        // https://react-bootstrap.netlify.com/components/images/#images

        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={element.containerclass}
          >
            <Images
              className={element.classname}
              id={element.id}
              src={element.src}
              fluid={element.fluid}
              rounded={element.rounded}
              thumbnail={element.thumbnail}
              circle={element.circle}
            />
          </Col>
        );
      case "pagination":
        // https://react-bootstrap.netlify.com/components/pagination/#pagination

        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col ${element.containerclass}`}
          >
            <Paginations
              className={element.classname}
              variant={element.variant}
              size={element.size}
              firstPage={element.firstPage}
              lastPage={element.lastPage}
              currentPage={element.currentPage}
            />
          </Col>
        );
      case "alert":
        // https://react-bootstrap.netlify.com/components/alerts/

        return (
          <Col
            key={idx}
            xs={element.col ? element.col : 12}
            className={`element-col ${element.containerclass}`}
          >
            <Alerts
              classname={element.classname}
              showAlert={element.showAlert}
              variant={element.variant}
              text={element.text}
              heading={element.heading}
            />
          </Col>
        );
      default:
      // code block
    }
  };

  render() {
    const props = this.props;

    return (
      <Modal
        show={props.showModal}
        onHide={props.toggleModal}
        size={props.size}
        animation
      >
        <Modal.Header>
          <Modal.Title style={{ fontWeight: "bold" }}>
            {props.header.title}
          </Modal.Title>

          {/* checks to see if header contains extra elements, and if it does, goes thru each one to render them */}
          {props.header.extras
            ? props.header.extras.map((elements: any, idx: any) =>
                this.getElement(elements, idx)
              )
            : null}
        </Modal.Header>

        <Modal.Body>
          {/* checks to see if row1 is being used, and if it is, render each one of its elements */}
          {props.row1 ? (
            <div className="modal-row">
              <Row>
                {props.row1.map((elements: any, idx: any) =>
                  this.getElement(elements, idx)
                )}
              </Row>
            </div>
          ) : null}

          {/* checks to see if row2 is being used, and if it is, render each one of its elements */}
          {props.row2 ? (
            <div className="modal-row">
              <Row className="modal-row">
                {props.row2.map((elements: any, idx: any) =>
                  this.getElement(elements, idx)
                )}
              </Row>
            </div>
          ) : null}

          {/* checks to see if row3 is being used, and if it is, render each one of its elements */}
          {props.row3 ? (
            <div className="modal-row">
              <Row className="modal-row">
                {props.row3.map((elements: any, idx: any) =>
                  this.getElement(elements, idx)
                )}
              </Row>
            </div>
          ) : null}

          {/* checks to see if row4 is being used, and if it is, render each one of its elements */}
          {props.row4 ? (
            <div className="modal-row">
              <Row>
                {props.row4.map((elements: any, idx: any) =>
                  this.getElement(elements, idx)
                )}
              </Row>
            </div>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <Container fluid>
            <Row className="justify-content-end">
              {/* checks to see if footer is being used, and if it is, render each one of its elements */}
              {props.footer
                ? props.footer.map((elements: any, idx: any) =>
                    this.getElement(elements, idx)
                  )
                : null}
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
    );
  }
}
