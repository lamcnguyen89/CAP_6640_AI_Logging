import React, { useState, useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import '../styles/App.css'
import { Button, Container } from 'react-bootstrap'
import { getShortCode } from '../helpers/ExperimentApiHelper'

const WebXRShortCode = () => {
  const { shortCode } = useParams<{ shortCode: string }>()
  const history = useHistory()

  const [fullCode, setFullCode] = useState(null)
  const [processingShortCode, setProcessingShortCode] = useState(true)
  const [validShortCode, setValidShortCode] = useState(false)

  useEffect(() => {
    const fetchShortCode = async () => {
      if (shortCode) {
        try {
          const res = await getShortCode(shortCode)
          if (res && res.status === 200) {
            setFullCode(res.data.fullCode)
            setValidShortCode(true)
          } else {
            setValidShortCode(false)
          }
        } catch (error) {
          setValidShortCode(false)
        }
        setProcessingShortCode(false)
      }
    }

    setProcessingShortCode(true)
    fetchShortCode()
  }, [shortCode])

  const redirectToExperiment = () => {
    if (fullCode && fullCode.targetPath) {
      history.push(fullCode.targetPath)
    }
  }

  return (
    <Container fluid className="full-height full-width" style={{ paddingTop: "60px" }}>
      {processingShortCode ? (
        <Container className="text-center">
          <h1>Loading...</h1>
        </Container>
      ) : validShortCode ? (
        <Container className="text-center">
          <h1>Short URL Success!</h1>
          <p>Your short URL has been used. It is now invalid, and cannot be used again.</p>
          <p>Click the button below to redirect to the long URL for your experiment's WebXR build.</p>
          <Button
            variant="primary"
            onClick={redirectToExperiment}
            style={{ minWidth: "200px"}}
          >Go to Experiment</Button>
        </Container>
      ) : (
        <div className="error-container text-center">
          <h1>Invalid Short URL</h1>
          <p>The provided short URL {shortCode} is not valid, or has expired.</p>
          <p>Short URLs expire after use, or after 1 hour. Please check your URL and try again.</p>
        </div>
      )}
    </Container>
  )
}

export default WebXRShortCode
