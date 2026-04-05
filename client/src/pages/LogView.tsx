import React, { useEffect, useState, ChangeEvent } from "react";
import { useHistory } from "react-router-dom";
import styled from 'styled-components';
import { useTable } from 'react-table';
import { Row, Col, Modal, Container, Button, Spinner, Form, InputGroup, Image } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import NavMenu from "../components/NavMenu";
import CustomAlert from '../components/CustomAlert';
import LogViewSideBar from "../components/LogView/LogViewSideBar";
import EditIcon from '../assets/edit.png';
import DeleteIcon from '../assets/delete-note.png';
import CloseIcon from '../assets/close.png';
import fwdArrowIcon from '../assets/arrow_forward_ios.svg';
import downloadIcon from '../assets/download_no_box.svg';
import { ParticipantState } from "./Admin";
import { getParticipantInfo, markParticipantWithdrawn } from "../helpers/ParticipantsApiHelper";
import FileTypePreview from "../components/LogView/FileTypePreview";
import { LogViewProvider, useLogView } from "../contexts/LogViewContext";


// Styled Components
const Styles = styled.div`
  padding: 1rem;
  table {
    width: 90%;
    border-collapse: collapse;
    margin-top: 3%;
    margin-left: auto;
    margin-right: auto;
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
    }
    th {
      color: #816F7D;
    }
  }
`;

const StyledPagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const PaginationItem = styled.button`
  background: none;
  color: black;
  border: none;
  cursor: pointer;
  padding: 10px;
  &:hover {
    text-decoration: underline;
  }
  &.active {
    font-weight: bold;
  }
`;

const PaginationLink = styled.span`
  cursor: pointer;
`;

// React Table component
function Table({ columns, data }) {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function LogView({
  match,
  participant,
  setShowLogs,
  experiment,
  handleDownloadParticipant
}) {
  return (
    <LogViewProvider>
      <LogViewContent
        match={match}
        participant={participant}
        setShowLogs={setShowLogs}
        experiment={experiment}
        handleDownloadParticipant={handleDownloadParticipant}
      />
    </LogViewProvider>
  );
}

function LogViewContent({
  match,
  participant,
  setShowLogs,
  experiment,
  handleDownloadParticipant
}) {
  const { reloadKey } = useLogView();
  const history = useHistory();

  // Tab state: "logs" or "notes"
  const [activeTab, setActiveTab] = useState<'logs' | 'notes'>('logs');

  // Previewed file type
  const [previewedFileTypeId, setPreviewedFileTypeId] = useState<string>(null);
  const [previewedFileTypeName, setPreviewedFileTypeName] = useState<string>(null);
  
  const handlePreviewedFileTypeChange = (fileTypeId: string, fileTypeName: string) => {
    setPreviewedFileTypeId(fileTypeId);
    setPreviewedFileTypeName(fileTypeName);
  }

  // Logs
  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Errors / modals
  const pageSize = 30;
  const maxVisiblePages = 10;
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Notes
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  // Pagination for notes
  const [notesPage, setNotesPage] = useState(1);
  const notesPerPage = 10;
  const totalNotesPages = Math.ceil(notes.length / notesPerPage);
  const notesToDisplay = notes.slice((notesPage - 1) * notesPerPage, notesPage * notesPerPage);

  // EDIT and DELETE state for notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetNoteId, setDeleteTargetNoteId] = useState<string | null>(null);

  const auth = useSelector(state => state.auth);
  let [isDownloading, setIsDownloading] = useState(false);
  const [participantInfo, setParticipantInfo] = useState<any>(null);
  const [participantExists, setParticipantExists] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);


  const handleReload = () => window.location.reload();
  const handleCloseAlert = () => setShowError(false);
  const handleWithdrawParticipant = () => setShowWithdrawConfirm(true);

  // Use participant ID from URL or props
  const participantId = match.params.participantId || participant;

  // Fetch notes only when in notes view
  useEffect(() => {
    if (activeTab !== 'notes') return;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}/api/notes/${participantId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: auth.token
          }
        });
        if (!res.ok) {
          console.error("Error fetching notes");
          return;
        }
        const data = await res.json();
        if (data.success && data.notes) {
          setNotes(data.notes);
          setNotesPage(1); // Reset page to 1 on fresh fetch
        }
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [activeTab, participantId]);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const info = await getParticipantInfo(participantId, auth.token);
        setParticipantExists(true);
        setParticipantInfo(info);
      } catch (error) {
        setParticipantExists(false);
        console.error("Error fetching participant info:", error);
      }
    }
    if (participantId) {
      fetchInfo();
    }
  }, [participantId, auth.token]);

  const handleWithdraw = async () => {
    if (!participantInfo) return;
    try {
      await markParticipantWithdrawn(experiment.id, participantInfo, auth.token);
      setParticipantInfo((prev: any) => ({
        ...prev,
        state: "WITHDRAWN"
      }));
    } catch (error) {
      console.error("Error marking participant as withdrawn:", error);
    } finally {
      setShowWithdrawConfirm(false);
    }
  };

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}/api/notes/${participantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth.token
        },
        body: JSON.stringify({ note: newNote })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.note) {
          // Ensure the researcher field is populated immediately
          if (!data.note.researcher || !data.note.researcher.email) {
            data.note.researcher = { email: auth.user.email };
          }
          setNotes(prev => [...prev, data.note]);
          setNewNote('');
        }
      } else {
        console.error("Error adding note:", await res.text());
      }
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  // Edit functionality
  const handleEditClick = (noteItem) => {
    setEditingNoteId(noteItem._id);
    setEditNoteText(noteItem.note);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteText('');
  };

  const handleSaveEdit = async (noteId) => {
    if (!editNoteText.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}/api/notes/${participantId}/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth.token
        },
        body: JSON.stringify({ note: editNoteText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.note) {
          // Ensure the researcher field is populated immediately
          if (!data.note.researcher || !data.note.researcher.email) {
            data.note.researcher = { email: auth.user.email };
          }
          setNotes(prevNotes => prevNotes.map(n => n._id === noteId ? data.note : n));
          setEditingNoteId(null);
          setEditNoteText('');
        }
      } else {
        console.error("Error updating note:", await res.text());
      }
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  // Delete functionality
  const handleDeleteClick = (noteId) => {
    setDeleteTargetNoteId(noteId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetNoteId) return;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}/api/notes/${participantId}/${deleteTargetNoteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth.token
        }
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n._id !== deleteTargetNoteId));
      } else {
        console.error("Error deleting note:", await res.text());
      }
    } catch (err) {
      console.error("Error deleting note:", err);
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetNoteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetNoteId(null);
  };

  // Notes pagination
  const handleNotesPageClick = (page) => {
    setNotesPage(page);
  };

  // Renders pagination items for notes (10 per page)
  const renderNotesPaginationItems = () => {
    const pages = [];
    const maxVisibleNotesPages = 5;
    if (totalNotesPages <= maxVisibleNotesPages) {
      for (let i = 1; i <= totalNotesPages; i++) {
        pages.push(
          <PaginationItem className={i === notesPage ? "active" : ""} onClick={() => handleNotesPageClick(i)} key={i}>
            <PaginationLink>{i}</PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      const leftEdge = Math.max(1, notesPage - Math.floor(maxVisibleNotesPages / 2));
      const rightEdge = Math.min(totalNotesPages, notesPage + Math.floor(maxVisibleNotesPages / 2));
      if (leftEdge > 1) {
        pages.push(
          <PaginationItem onClick={() => handleNotesPageClick(1)} key="first-notes">
            <PaginationLink>1</PaginationLink>
          </PaginationItem>
        );
        if (leftEdge > 2) {
          pages.push(<PaginationItem disabled key="ellipsis-notes1"><PaginationLink>...</PaginationLink></PaginationItem>);
        }
      }
      for (let i = leftEdge; i <= rightEdge; i++) {
        pages.push(
          <PaginationItem className={i === notesPage ? "active" : ""} onClick={() => handleNotesPageClick(i)} key={i}>
            <PaginationLink>{i}</PaginationLink>
          </PaginationItem>
        );
      }
      if (rightEdge < totalNotesPages) {
        if (rightEdge < totalNotesPages - 1) {
          pages.push(<PaginationItem disabled key="ellipsis-notes2"><PaginationLink>...</PaginationLink></PaginationItem>);
        }
        pages.push(
          <PaginationItem onClick={() => handleNotesPageClick(totalNotesPages)} key="last-notes">
            <PaginationLink>{totalNotesPages}</PaginationLink>
          </PaginationItem>
        );
      }
    }
    return pages;
  };

  // Custom button for download icon
  const CustomButton = ({ onClick, disabled, children }) => (
    <button style={{ border: 'none', background: 'none', padding: '0' }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );

  const handleBack = () => {
    setShowLogs(null);
    history.push(`${location.pathname}`);
  }



  return (
    <>
      <NavMenu title="Management" />
      <CustomAlert show={showError} message={error} onClose={handleCloseAlert} onReload={handleReload} />

      {/* Delete confirmation modal */}
      <Modal show={showDeleteModal} onHide={handleCancelDelete}>
        <Modal.Body>
          <b>Are you sure you want to delete the note?</b>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button className="cancel-button m-3" onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button className="toast-button m-3" onClick={handleConfirmDelete}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showWithdrawConfirm} onHide={() => setShowWithdrawConfirm(false)}>
        <Modal.Body style={{ textAlign: 'center' }}>
          <b style={{ color: '#EF2C2C' }}>Are you sure you want to mark this participant as 'Withdrawn' from the experiment?</b>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button className="tertiary-button me-4" onClick={() => setShowWithdrawConfirm(false)}>
            Cancel
          </Button>
          <Button className="toast-button m-3" onClick={handleWithdraw}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>

      <Container>
        { participantExists ? (
        <Container>
          <div style={{ height: '20px' }}></div>
          {/* Header with experiment name, participant ID, download button */}
          <Row>
            <Col md={9} className="d-flex align-items-center">
              <h1>
                {experiment ? experiment.name : ''}
              </h1>
              <Image src={fwdArrowIcon} className="ms-4" />
              <h1 className="ms-4" style={{ color: "#816F7D" }}>
                Participant ID: {participantInfo ? ` ${participantInfo.pID}` : ''}
              </h1>
            </Col>
            <Col md={3} className="d-flex justify-content-end">
              <Button
                className="tertiary-button"
                style={{ width: "200px", height: "40px", fontSize: "14px" }}
                disabled={isDownloading}
                onClick={async () => {
                  setIsDownloading(true);
                  try {
                    await handleDownloadParticipant(participantId);
                  } finally {
                    setIsDownloading(false);
                  }
                }}
              >
                {isDownloading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    Download Participant
                    <Image src={downloadIcon} className="ms-2" />
                  </>
                )}
              </Button>
            </Col>
          </Row>
          <div style={{ height: '10px' }}></div>
          {/* Left side, with list of file types and widthdraw section */}
          <Row>
            {activeTab !== 'notes' && (
              <Col md={3}>
                <LogViewSideBar
                  participantId={participantId}
                  experimentId={experiment.id}
                  previewedFileTypeId={previewedFileTypeId}
                  handlePreviewedFileTypeChange={handlePreviewedFileTypeChange}
                  participantInfo={participantInfo}
                  handleWithdrawParticipant={handleWithdrawParticipant}
                />
              </Col>
            )}

            <Col md={activeTab !== 'notes' ? 9 : 12}>
              {activeTab === 'logs' && (
                <FileTypePreview
                  key={reloadKey}
                  participantId={participantId}
                  previewedFileTypeId={previewedFileTypeId}
                  previewedFileTypeName={previewedFileTypeName}
                />
              )}

              {activeTab === 'notes' && (
                <div className="trial-content">
                  <div style={{ padding: '23px 32px' }}>
                    <h3 style={{ color: '#816F7D', marginBottom: '1rem' }}>Notes</h3>

                    {/* Scrollable container for paginated notes */}
                    <div
                      style={{
                        height: '250px',
                        overflowY: 'auto',
                        marginBottom: '1rem'
                      }}
                    >
                      {notesToDisplay.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#777' }}>
                          No notes have been added yet.
                        </p>
                      ) : (
                        notesToDisplay.map((noteItem) => {
                          const isEditing = editingNoteId === noteItem._id;
                          return (
                            <div
                              key={noteItem._id}
                              style={{
                                backgroundColor: '#F4ECF9',
                                borderRadius: '6px',
                                padding: '1rem',
                                marginBottom: '1rem',
                                position: 'relative'
                              }}
                            >
                              {/* Email at top-left */}
                              <div style={{ fontWeight: 'bold', color: '#4B3C50' }}>
                                {noteItem.researcher?.email || 'Researcher'}
                              </div>

                              {/* edit and delete icons at top-right */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '1rem',
                                  right: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                {isEditing ? (
                                  <>
                                    {/* Save and Cancel icons/buttons */}
                                    <Button variant="outline-secondary" size="sm" style={{ width: '100px', height: '32px', background: '#644F64', color: '#ffffff' }} onClick={() => handleSaveEdit(noteItem._id)}>
                                      Save
                                    </Button>
                                    <Image src={CloseIcon} className="dashboard-icons" style={{ cursor: 'pointer' }} alt="Cancel Icon" onClick={handleCancelEdit} />
                                  </>
                                ) : (
                                  <>
                                    <Image src={EditIcon} className="dashboard-icons" style={{ cursor: 'pointer' }} alt="Edit Icon" onClick={() => handleEditClick(noteItem)} />
                                    <Image src={DeleteIcon} className="dashboard-icons" style={{ cursor: 'pointer' }} alt="Delete Icon" onClick={() => handleDeleteClick(noteItem._id)} />
                                  </>
                                )}
                              </div>

                              {/* Timestamp at top-left */}
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#6E6E6E',
                                }}
                              >
                                {new Date(noteItem.createdAt).toLocaleString()}
                              </div>

                              {/* Note text or edit form */}
                              {!isEditing ? (
                                <div style={{ marginTop: '1.5rem', color: '#333' }}>
                                  {noteItem.note}
                                </div>
                              ) : (
                                <Form.Group style={{ marginTop: '1.5rem' }}>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editNoteText}
                                    onChange={(e) => setEditNoteText(e.target.value)}
                                  />
                                </Form.Group>
                              )}

                              {/* Action icons row */}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '1rem',
                                  right: '1rem',
                                  display: 'flex',
                                  gap: '0.75rem'
                                }}
                              >

                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Render notes pagination */}
                    <StyledPagination>{renderNotesPaginationItems()}</StyledPagination>

                    {/* New note input */}
                    <Form.Group className="mt-3">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Insert note here..."
                        style={{ marginBottom: '1rem' }}
                      />
                    </Form.Group>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Button className="tertiary-button" style={{ width: "160px", height: "40px", marginTop: '0px' }} onClick={() => setActiveTab('logs')}>
                        Cancel
                      </Button>
                      <Button variant="primary" style={{ marginTop: '0px', borderRadius: '12px' }} onClick={handleAddNote}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Col>
          </Row>

          {activeTab !== 'notes' && (
            <div style={{ position: 'fixed', bottom: '20px', right: '80px', textAlign: 'right' }}>
              <Button variant="primary" onClick={() => handleBack()}>Back</Button>
            </div>
          )}
        </Container>
        ) : (
          <Container className="text-center mt-4">
            <h1>Participant not found.</h1>
            <p>
              No participant found for this URL. Please check the URL and try again.
            </p>
            <Button variant="primary" onClick={() => handleBack()}>Back</Button>
          </Container>
        )}
        <div style={{ height: '40px' }}></div>
      </Container>
    </>
  );
}
