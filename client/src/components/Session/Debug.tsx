import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function Debug({ participantId, step, history }) {
  let [participants, setParticipants] = React.useState([])
  function clearCache() {
    // let pInfo = {...participantInfo}
    // let curStory = participantInfo.currentStory
    // Get all substories
    localStorage.clear()
    localStorage.setItem("twine-prefs", "a812d7f5-fbcd-47b6-b526-f0b481c306da")
    localStorage.setItem("twine-prefs-a812d7f5-fbcd-47b6-b526-f0b481c306da", "{\"id\": \"a812d7f5-fbcd-47b6-b526-f0b481c306da\", \"name\": \"welcomeSeen\", \"value\": true}")
  }
  function clearParticipantCache() {
    sessionStorage.clear()
  }
  function clearParticipantLogs() {
    fetch(`/api/logs/${participantId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
  function clearParticipantComments(participantId) {
    // let pInfo = {...participantInfo}
    // let curStory = participantInfo.currentStory
    // Get all substories
    localStorage.clear()
  }
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}/api/participants/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        let cParticipants = await res.json()
        console.log(cParticipants)
        setParticipants(cParticipants)
      })
  }, [])
  return (<div style={{ width: "100vw", height: "100px" }}>
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ display: 'flex' }}>
        <Button size="sm" onClick={() => clearCache()}>Clear Cache</Button>
        <Button size="sm" onClick={() => clearParticipantCache()}>Clear Participant Cache</Button>
        <Button size="sm" onClick={() => clearParticipantLogs()}>Clear Participant Logs</Button>
        <Button size="sm" onClick={() => clearParticipantComments(participantId)}>Clear Participant Comments</Button>
      </div>
      {participants ?
        <div style={{ flex: "1 1 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {
              participants.map(
                (participant, i) =>
                  <p key={i} style={{ flex: "1 0 auto", backgroundColor: participant.uid == participantId ? "yellow" : undefined }}>
                    <Button size="sm" onClick={() => window.location.href = `/study/1/${participant.uid}/session?debug=1&step=${step}`}>
                      {participant.note}|S:{new Date(participant.sessionStart).toLocaleString()}
                    </Button>
                  </p>)
            }
          </div>
        </div>
        : undefined}
    </div>
    <div style={{ flex: "1 0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {
          [0, 1, 2, 3, 4, 5, 6, 7].map(
            (newStep, i) =>
              <p key={i} style={{ flex: "1 0 auto" }}>
                <Button size="sm" variant={newStep == step ? "primary" : "secondary"} onClick={() => window.location.href = `/study/1/${participantId}/session?debug=1&step=${newStep.toString()}`}>
                  Step {newStep}
                </Button>
              </p>)
        }
      </div>
    </div>
  </div>)
}