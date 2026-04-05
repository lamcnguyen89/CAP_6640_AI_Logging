import React, { Component } from "react"
import { Container, Row, Col, Button } from "react-bootstrap"
import { connect } from "react-redux"

// interfaces
import { IExperiment } from "../interfaces/Experiment"

// components
import SettingsCard from "../components/Settings/SettingsCard"
import NavMenu from "../components/NavMenu"
import GeneralModal from "../components/GeneralModal"

// helper api file
import { getCollaborators, addCollaborator } from "../helpers/UsersApiHelper"
import { getExperiment, deleteExperiment } from "../helpers/ExperimentApiHelper"

// styles
import "../styles/settings.css"
import Collaborator from "../interfaces/Collaborator"

interface ISettingsProps {
  history: any
  location: any
  auth: any
  match: any
  vimeoClient: any
}

interface ISettingsState {
  // page states
  collaborators: Array<Collaborator>
  experiment: IExperiment | null
  loading: boolean
  showModal: boolean
  showAlert: boolean
  expId: any
  deleteId: any

  // modal states
  modalFormState: string
  searchedString: string
  modalSize: string
  modalHeader: any
  row1: Array<any>
  row2: Array<any>
  row3: Array<any>
  footer: Array<any>
}

class Settings extends Component<ISettingsProps, ISettingsState> {
  constructor(props: ISettingsProps) {
    super(props)

    this.state = {
      // page states

      collaborators: [],
      experiment: null,
      expId: this.props.match.params.expId,
      loading: true,
      showModal: false,
      deleteId: "",

      // modal states
      showAlert: false,
      modalHeader: "",
      modalSize: "",
      modalFormState: "",
      searchedString: "",
      row1: [],
      row2: [],
      row3: [],
      footer: [],
    }
  }

  componentDidMount() {
    this.getExp()
    this.getCollaboratorsApi()
  }

  getExp = () => {
    const token = this.props.auth.token
    const state = (exp: any) =>
      this.setState({ experiment: exp }, () => {
        
      })

      getExperiment(this.state.expId, token, state)
  };

  deleteExp = () => {
    const token = this.props.auth.token

    if (this.state.modalFormState === this.state.experiment.name) {
      deleteExperiment(this.state.expId, token, this.returnToDashboard)
    } else {
      alert("wrong name")
    }
  };


  // toggles the visibility of the modal from show/hide
  toggleModal = () => {
    this.setState({
      showModal: !this.state.showModal,
      modalFormState: "",
      searchedString: "",
    })
  };

  // temp function i use to check state, will be deleted eventually
  checkState = () => {
    console.log(this.state)
    this.toggleModal()
  };



  onChange = (e: any) => {
    this.setState({
      modalFormState: e.target.value,
    })
  };
  handleDeleteExp = () => {
    deleteExp(this.state.expId, this.props.auth.token, window.location.reload())
    this.props.history.goBack()
  }
  returnToDashboard = () => {
    this.props.history.goBack()
  };

  // ---------- collaborators api calls ------------------

  getCollaboratorsApi = () => {
    const token = this.props.auth.token
    const state = (e: any) => this.setState({ collaborators: e })

    getCollaborators(this.state.expId, token, state)
  };

  addCollaborator = () => {
    const token = this.props.auth.token
    const email = this.state.modalFormState

    addCollaborator(this.state.expId, email, token, this.getCollaboratorsApi)
    this.toggleModal()
  };
  // creates adding collaborator modal
  handleAddCollaborator = () => {
    this.setState({
      modalHeader: { title: "Add Researchers" },
      modalSize: "md",
      row1: [
        {
          element: "textbox",
          type: "email",
          placeholder: "Enter Researchers Email",
          label: "Researchers Email",
          onChange: this.onChange,
          size: "lg",
        },
      ],
      row2: null,
      row3: null,
      footer: [
        {
          element: "button",
          text: "Cancel",
          variant: "danger",
          col: 2,
          onClick: this.toggleModal,
        },
        {
          element: "button",
          text: "Add",
          variant: "primary",
          col: 2,
          onClick: this.addCollaborator,
        },
      ],
    })
    this.toggleModal()
  };

  deleteCollaboratorCallback = () => {
    const email = this.state.deleteId
    const token = this.props.auth.token
    const state = () =>
      this.setState({
        collaborators: this.state.collaborators.filter((p) => p.email !== email),
      })

    console.error("Unable to delete collaborator - functionality not yet implemented.")
    this.toggleModal()
  };
  // creates delete collaborator modal
  handleDeleteCollaborator = (id: any) => {
    this.setState({
      deleteId: id,
      modalHeader: { title: "Delete Researchers" },
      modalSize: "md",
      row1: [
        {
          element: "p",
          text:
            "Are you sure you want to delete this person? doing so will make them unable to see/work on the experiment any further",
        },
      ],
      row2: null,
      row3: null,
      footer: [
        {
          element: "button",
          text: "Cancel",
          variant: "primary",
          col: 2,
          onClick: this.toggleModal,
        },
        {
          element: "button",
          text: "Delete",
          variant: "danger",
          col: 2,
          onClick: this.deleteCollaboratorCallback,
        },
      ],
    })
    this.toggleModal()
  };

  render() {
    return (
      <Container
        id="setting-page"
        fluid
        style={{ paddingRight: 0, paddingLeft: 0 }}
      >
        <NavMenu title="Settings" study={this.state.experiment ? this.state.experiment.name : undefined} experimentId={this.state.expId} />

        <Container style={{ marginTop: "10px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <GeneralModal
              showModal={this.state.showModal}
              toggleModal={this.toggleModal}
              header={this.state.modalHeader}
              size={this.state.modalSize}
              row1={this.state.row1}
              row2={this.state.row2}
              row3={this.state.row3}
              footer={this.state.footer}
            />

            <Col>
              <SettingsCard
                title="Collaborators"
                collaboratorList={this.state.collaborators}
                seeModal={this.state.showModal}
                toggleModal={this.toggleModal}
                handleAdd={this.handleAddCollaborator}
                handleDelete={this.handleDeleteCollaborator}
              />
            </Col>
          </Row>

          <hr></hr>
          <Row style={{ marginTop: "20px" }}>
            <Col>
              <Button
                size="lg"
                variant="dark"
                onClick={this.returnToDashboard}
                style={{ marginBottom: "15px" }}
              >
                Back
              </Button>
            </Col>
          </Row>
        </Container>
      </Container>
    )
  }
}

const mapStateToProps = (state: any) => ({
  auth: state.auth,
})

export default connect(mapStateToProps, {})(Settings)
