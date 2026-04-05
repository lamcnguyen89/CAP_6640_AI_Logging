import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Form,
  FormGroup,
  InputGroup,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import "../../styles/App.css";
import { generateShortCode, getWebxrPaths } from "../../helpers/ExperimentApiHelper";
import { Link } from "react-router-dom";

// Props
interface WebXRLinkDisplayProps {
  auth: any;
  experimentIdToEdit: string;
  isMultiSite: boolean;
  sites: any[];
  permissionRole: string;
}

const WebXRLinkDisplay: React.FC<WebXRLinkDisplayProps> = ({
  auth,
  experimentIdToEdit,
  isMultiSite,
  sites,
  permissionRole,
}) => {
  const [webXRExists, setWebXRExists] = useState<boolean>(false);
  const [effectiveSites, setEffectiveSites] = useState<any[]>([]);
  const [showShortUrlModal, setShowShortUrlModal] = useState<boolean>(false);
  const [generatingShortUrl, setGeneratingShortUrl] = useState<boolean>(false);
  const [shortUrl, setShortUrl] = useState<string>("");
  const [shortUrlError, setShortUrlError] = useState<string>("");

  // Effect to get the WebXR info for the experiment
  useEffect(() => {
    const fetchWebXRInfo = async () => {
      console.log(sites);
      if (experimentIdToEdit) {
        const webXRPaths = await getWebxrPaths(auth.token, experimentIdToEdit);
        if (webXRPaths && webXRPaths.httpStatus === 200) {
          setWebXRExists(true);
        } else {
          setWebXRExists(false);
        }
      } else {
        setWebXRExists(false);
      }
    };
    fetchWebXRInfo();
  }, [auth, experimentIdToEdit]);

  // Effect to get the effective / enabled sites (sites with existing IDs)
  useEffect(() => {
    if (isMultiSite && sites && sites.length > 0) {
      // Get sites with existing IDs (effective sites)
      const effectiveSites = sites.filter((site: any) => site.existingId);
      setEffectiveSites(effectiveSites);
    } else {
      setEffectiveSites([]);
    }
  }, [isMultiSite, sites]);

  // Function to generate a short URL for the experiment
  const generateShortUrl = async (siteId?: string) => {
    setGeneratingShortUrl(true);
    const res = await generateShortCode(experimentIdToEdit, auth.token, siteId);
    setGeneratingShortUrl(false);
    if (!res || res.httpStatus >= 300) {
      setShortUrlError("Failed to generate short URL. Please try again.");
      return;
    } else {
      setShortUrl(res.code);
      setShortUrlError("");
    }
  };

  return (
    <Container
      style={{
        border: "1px solid lightgrey",
        borderRadius: "5px",
        padding: "15px 45px",
      }}
    >
      <Row>
        <Col>
          <h2>WebXR Link</h2>
        </Col>
      </Row>
      {experimentIdToEdit ? (
        <Row>
          <Col>
            {webXRExists ? (
              <div>
                <p className="mb-2">Your WebXR experience is ready!</p>
                {isMultiSite && effectiveSites.length > 1 ? (
                  <div>
                    <p>
                      Distribute one of the links below to your participants
                      according to the site you wish to record data to. Once a
                      participant opens this link, they will begin the
                      experiment, and data will begin recording to the selected
                      site.
                    </p>
                    {effectiveSites.map((site, index) => (
                      <div>
                        <h3>
                          Site "{site.name}" ({site.shortName}):
                        </h3>
                        <Link
                          key={index}
                          to={`/vera-portal/webxr/${experimentIdToEdit}?siteId=${site.existingId}`}
                        >
                          <p>{`${window.location.origin}/vera-portal/webxr/${experimentIdToEdit}?siteId=${site.existingId}`}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="m-0">
                      Distribute the link below to your participants. Once a
                      participant opens this link, they will begin the
                      experiment, and data will begin recording.
                    </p>
                    <Link to={`/vera-portal/webxr/${experimentIdToEdit}`}>
                      <p>{`${window.location.origin}/vera-portal/webxr/${experimentIdToEdit}`}</p>
                    </Link>
                  </div>
                )}
                <hr className="mt-3" />
                <p className="mt-2">
                  If you'd like a shorter URL, try{" "}
                  <span
                    style={{
                      color: "blue",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowShortUrlModal(true)}
                  >
                    generating a short URL
                  </span>
                  .
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-2">
                  You have not yet built your experiment for WebXR.
                </p>
                <p className="m-0">
                  You can build your experiment for WebXR using the VERA tools.
                  After building, come back here to see your experiment's WebXR
                  link.
                </p>
              </div>
            )}
          </Col>
        </Row>
      ) : (
        <Row>
          <Col>
            <p>
              Once you have created your experiment, you can build it for WebXR
              using the VERA tools. After building, come back here to see your
              experiment's WebXR link.
            </p>
          </Col>
        </Row>
      )}

      <Modal
        show={showShortUrlModal}
        onHide={() => setShowShortUrlModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Generate Short URL</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {generatingShortUrl ? (
            <div className="text-center">
              <p>Loading...</p>
            </div>
          ) : shortUrlError ? (
            <div className="text-center">
              <p>{shortUrlError}</p>
              <Button
                style={{ minWidth: "200px" }}
                onClick={() => {
                  setGeneratingShortUrl(false);
                  setShortUrl("");
                  setShortUrlError("");
                  setShowShortUrlModal(false);
                }}
              >
                Close
              </Button>
            </div>
          ) : shortUrl ? (
            <div className="text-center">
              <p>Below is your short URL. This URL is a one-time-use URL, which will redirect you to your experiment's long URL:</p>
              <p>
                <strong>{`${window.location.origin}/vera-portal/s/${shortUrl}`}</strong>
              </p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/vera-portal/s/${shortUrl}`);
                }}
                className="me-2"
              >
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => {
                  setShortUrl("");
                  setShowShortUrlModal(false);
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <div>
              <p>
                When entering your experiment's long URL is too cumbersome (such as
                when using a VR browser), you can instead generate a short URL which
                can be used to access your experiment's long URL.
              </p>
              <p>
                Once you use your short URL, you will be redirected to the long URL
                for your experiment's WebXR build. You can then bookmark this URL
                for future use. Once you use the short URL, it will become invalid
                and cannot be used again. Short URLs also expire after 1 hour of
                inactivity. You can generate a new short URL at any time.
              </p>
              {isMultiSite && effectiveSites.length > 1 ? (
                <div>
                  {effectiveSites.map((site, index) => (
                    <Row key={index} className="mb-3">
                      <Col xs={7}>
                        <h3>
                          Site "{site.name}" ({site.shortName}):
                        </h3>
                      </Col>
                      <Col xs={5}>
                        <Button
                          onClick={() => generateShortUrl(site.existingId)}
                          className="w-100 mb-3"
                          disabled={generatingShortUrl}
                        >
                          Generate Short URL
                        </Button>
                      </Col>
                    </Row>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-center">
                    <Button
                      onClick={() => generateShortUrl()}
                      style={{ minWidth: "200px" }}
                      disabled={generatingShortUrl}
                    >
                      Generate Short URL
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default WebXRLinkDisplay;
