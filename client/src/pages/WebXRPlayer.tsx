import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Container } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';
import { getWebxrPaths } from '../helpers/ExperimentApiHelper';

// Extend Window interface for Unity WebGL
declare global {
  interface Window {
    createUnityInstance: any;
  }
}

const WebXRPlayer = () => {
  const auth = useSelector((state: any) => state.auth);
  const canvasRef = useRef(null);

  // Get experiment and site IDs from the URL parameters
  const { experimentId } = useParams<{ experimentId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const siteId = searchParams.get('siteId');

  // States for Unity management and loading status
  const [unityInstance, setUnityInstance] = useState(null);
  const [buildExists, setBuildExists] = useState(false);
  const [loadedExperience, setLoadedExperience] = useState(false);

  useEffect(() => {
    async function loadUnityInstance() {
      const webXrPaths = await getWebxrPaths(auth.token, experimentId);

      if (webXrPaths.httpStatus !== 200) {
        setBuildExists(false);
        setLoadedExperience(true);
        console.error('Failed to fetch WebXR paths: ', webXrPaths);
        return;
      }

      setBuildExists(true);

      const mainUrl = `/uploads/webxr/${experimentId}`;
      const loaderUrl = `${mainUrl}/${webXrPaths.loaderPath}`;
      const config = {
        dataUrl: `${mainUrl}/${webXrPaths.dataPath}`,
        frameworkUrl: `${mainUrl}/${webXrPaths.frameworkPath}`,
        codeUrl: `${mainUrl}/${webXrPaths.wasmPath}`,
        streamingAssetsUrl: `${mainUrl}/${webXrPaths.mainName}/StreamingAssets`,
        companyName: 'VERA',
        productName: webXrPaths.mainName,
        productVersion: '1.0',
        webxrContextAttributes: { optionalFeatures: ['local-floor', 'bounded-floor', 'gamepad', 'layers'] },
        webglContextAttributes: { antialias: false, xrCompatible: true },
      };

      const scriptId = `unity-loader-${experimentId}`;
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = loaderUrl;
        script.async = false;
        script.onload = () => {
          window.createUnityInstance(canvasRef.current, config)
            .then(instance => {
              setUnityInstance(instance);
              console.log('Unity instance created successfully');
              
              // Initialize the logger with the siteId if provided
              // Otherwise initialize with no site ID - signals Unity to use the build's default active site.
              if (siteId) {
                console.log('Sending siteId to Unity:', siteId);
                instance.SendMessage('VERALogger', 'InitializeFromWebXR', siteId);
              } else {
                console.log('No siteId provided, initializing without siteId');
                instance.SendMessage('VERALogger', 'InitializeFromWebXR', '');
              }
            })
            .catch(err => console.error('Unity failed to load:', err));
        };
        document.body.appendChild(script);
        setLoadedExperience(true);
      }


      return () => {
        if (unityInstance) {
          unityInstance.Quit().then(() => setUnityInstance(null));
        }
      };
    }

    loadUnityInstance();
  }, []);

  const enterVR = () => {
    if (unityInstance) {
      console.log('Entering VR...');
      unityInstance.Module.WebXR.toggleVR();
    }
  };

  return (
    <Container fluid className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh' }}>
      {loadedExperience === true ? (
        <>
          {buildExists === true ? (
            <>
              <canvas
                ref={canvasRef}
                id="unity-canvas"
                style={{ width: '100%', height: '80vh', background: '#000' }}
              />
              <Button id="enter-vr" onClick={enterVR} className="mt-3">
                Enter VR
              </Button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h2>WebXR Experience Not Found</h2>
              <p className="m-0">No WebXR experience could be found for this experiment.</p>
              <p className="m-0">Check the URL and try again.</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      )}
    </Container>
  );
};

export default WebXRPlayer;
