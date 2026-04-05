import React from "react";
import { Modal } from "react-bootstrap";
import dropdown from "../assets/dropdown.png";
import noOverlap from "../assets/noOverlap.png";
import choices from "../assets/choices.png";
import overlap from "../assets/overlap.png";
import select from "../assets/select.png";
import deleteAnn from "../assets/delete.png";
import proto from "../assets/proto.png";

interface ModalProps {
  showModal: boolean;
  onHide: any;
}

class HelpModal extends React.Component<ModalProps> {
  render() {
    return (
      <Modal
        show={this.props.showModal}
        size="lg"
        scrollable
        onHide={this.props.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>How to Annotate</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h5>Adding Annotations</h5>
          <ol>
            <li>
              <p>Select your annotation type</p>
              <img
                src={dropdown}
                style={{ width: "10%", height: "10%" }}
                alt="dropdown"
              />
              <p>&quot;Scene&quot; for story scenes.</p>
              <p>&quot;Beat&quot; for smaller actions within scenes.</p>
              <p>&quot;Choice&quot; for when a choice is made.</p>
            </li>

            <li>
              <p>Add your annotation.</p>
              <p>For Scenes and Beats:</p>
              <p>
                On the upper box below visualizations, click your annotation
                start time and click your annotation end time.
              </p>
              <img
                src={noOverlap}
                style={{ width: "30%", height: "30%" }}
                alt="timespan annotation"
              />
              <p>For Choices:</p>
              <p>
                On the lower box below visualizations, click your annotation
                time.
              </p>
              <img
                src={choices}
                style={{ width: "10%", height: "10%" }}
                alt="timestamp annotation"
              />
              <p>
                Scenes may not overlap with eachother, beats may not overlap
                with eachother, however beats and choices may lie in the same
                time frames as scenes.
              </p>
              <img
                src={overlap}
                style={{ width: "30%", height: "30%" }}
                alt="all annotation types"
              />
            </li>

            <li>
              <p>Select the proto element the annotation is associated with.</p>
              <img
                src={select}
                style={{ width: "30%", height: "30%" }}
                alt="select protoelement"
              />
            </li>

            <li>
              <p>
                Add the annotation or cancel the action. You can also cancel
                adding an annotation by clicking the ESCAPE button.
              </p>
            </li>
          </ol>

          <hr></hr>
          <h5>Deleting Annotations</h5>
          <ol>
            <li>
              <p>Right click on the annotation you wish to delete.</p>
            </li>

            <li>
              <p>Delete the annotation or cancel the action.</p>
              <img
                src={deleteAnn}
                style={{ width: "30%", height: "30%" }}
                alt="delete annotation"
              />
            </li>
          </ol>

          <hr></hr>
          <h5>Adding ProtoElements</h5>
          <ul>
            <p>
              ProtoElements are the set of all of the element that occurs in the
              media. For example a protoscene is the set of all possible scenes
              a subject may view, and a subject&apos;s scenes will be linked to
              the protoscenes.
            </p>
          </ul>
          <ol>
            <li>
              <p>
                Press the ProtoElements button to redirect back to settings to
                add protoelements.
              </p>
              <img
                src={proto}
                style={{ width: "15%", height: "15%" }}
                alt="add protoelements"
              />
            </li>
          </ol>

          <hr></hr>
          <h5>Video Key Controls</h5>
          <ul>
            <p>
              Videos are able to be controled through keys, as well as clicks.
              The following are the keys to control the videos at the top of
              your screen
            </p>
          </ul>
          <li>Play/Pause: Space</li>
          <li>Forward: &quot;f&quot;</li>
          <li>Rewind: &quot;r&quot;</li>
          <li>Next Frame: &rarr;</li>
          <li>Previous Frame: &larr;</li>
          <li>restart: &quot;0&quot;</li>
          {/* <li>
            toggle specific video control: &quot;m&quot;, then
            <ul>
              <li>Next Video: &quot;n&quot;</li>
              <li>Previous Video: &quot;p&quot;</li>
              <li>Leave specific video control: &quot;m&quot;</li>
            </ul>
          </li> */}
        </Modal.Body>
      </Modal>
    );
  }
}

export default HelpModal;
