import React from 'react'
import { connect } from 'react-redux'
import { Button, ListGroup, Card, Form, FormGroup } from 'react-bootstrap'

// eslint-disable-next-line no-unused-vars
import Collaborator from '../../interfaces/Collaborator'
// eslint-disable-next-line no-unused-vars
import List from './List'

interface ICardProp {
    title: 'Collaborators' | 'Experiments' | 'Conditions';
    collaboratorsList?: Array<Collaborator>; // ? means that it can be "undefined" (not passed to props)
    experimentList?: Array<any>;
    seeModal: boolean;
    toggleModal: any;

    handleDelete?: any;
    handleAdd?: any;
    auth: any;
}

interface ICardState {
    deleteId: any,
    helperTxt: any,
    showModal: boolean;
}

type SelectElement = React.FormEvent<HTMLSelectElement>;

/** cards for each individual experiment that appears in dashboard */
class SettingsCard extends React.Component<ICardProp, ICardState> {
  constructor (props: ICardProp) {
    super(props)

    this.state = {
      deleteId: '',
      helperTxt: '',
      showModal: false,
    }
  }

    buildList = () => {
      const { collaboratorList, title, experimentsList, handleDelete } = this.props
      const list: Array<any> = []

      if (title === 'Collaborators') {
        collaboratorList.map((listItem: any) => {
          return (
            list.push(<List
              key={listItem._id}
              itemId={listItem.email}
              itemName={listItem.email}
              firstName={listItem.firstName}
              lastName={listItem.lastName}
              handleDelete={this.props.handleDelete}
            />)
          )
        })
      } else if (title === 'Experiments') {
        experimentsList.map((listItem, index) => {
          return (
            list.push(<List
              key={index}
              itemId={index}
              itemName={listItem.name}
              firstName={listItem.description}
              lastName={''}
              handleDelete={handleDelete}
            />)
          )
        })
      } 
      return list
    }


    render () {
      const { handleAdd, title } = this.props
      let list: Array<any> = []
      list = this.buildList()

      return (

        <div>
          <Card style={{ border: '5px solid black', borderRadius: '10px', maxHeight: '40%' }}>

            <Card.Header style={{ backgroundColor: 'black', color: 'white' }}>
              <Card.Title className="text-center"
                style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{title}
              </Card.Title>
            </Card.Header>

            <div style={{ maxHeight: '450px' }}>
              <ListGroup variant="flush" style={{ height: '350px', overflowY: 'auto', overflowX: 'hidden' }}>
                {list}
              </ListGroup>
            </div>

            <Card.Footer>
              <Button variant="primary" onClick={handleAdd}>{`+ Add ${title}`}</Button>
            </Card.Footer>
          </Card>
        </div>
      )
    }
}

const mapStateToProps = (state: any) => ({
  auth: state.auth
})

export default connect(mapStateToProps, {})(SettingsCard)
