import React, { Component } from 'react'
import { Row, Col, ListGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'

interface props {
    firstName?: any;
    lastName?: any;
    itemName?: any;
    itemId?: any;
    // index: number;

    handleDelete?: any;
}

class List extends Component<props> {
  render () {
    const { itemName, firstName, lastName, itemId, handleDelete } = this.props
    return (
      <ListGroup.Item style={{ fontSize: '20px' }}>
        <Row>
          <Col sm={10} style={{ paddingLeft: 0 }}>
            {firstName ? `${itemName} - ${firstName} ${lastName}` : itemName}
          </Col>

          <Col sm={2}>
            <button className="content-btn" onClick={() => handleDelete(itemId)}>
              <FontAwesomeIcon className="content-btn-icon" icon={faTimesCircle} />
            </button>
          </Col>

        </Row>
      </ListGroup.Item>
    )
  }
}

export default List
