import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { getExperimentFullRes } from "../helpers/ExperimentApiHelper";

interface ExperimentAccessErrorProps {
  experimentId: string;
  authToken: string;
  children?: React.ReactNode;
}

const ExperimentAccessError: React.FC<ExperimentAccessErrorProps> = ({
  experimentId,
  authToken,
  children,
}) => {
  const [experimentExists, setExperimentExists] = useState<boolean | null>(
    null
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkExperimentAccess = async () => {
      try {
        const res = await getExperimentFullRes(experimentId, authToken);

        if (res.status === 200) {
          setExperimentExists(true);
          setHasPermission(true);
        } else if (res.status === 403) {
          setExperimentExists(true);
          setHasPermission(false);
        } else {
          setExperimentExists(false);
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Error checking experiment access:", error);
        setExperimentExists(false);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (experimentId && authToken) {
      checkExperimentAccess();
    }
  }, [experimentId, authToken]);

  // Show loading state while checking access
  if (isLoading) {
    return (
      <Container className="text-center mt-4">
        <p>Loading experiment...</p>
      </Container>
    );
  }

  // Show error if experiment doesn't exist
  if (!experimentExists) {
    return (
      <Container className="text-center mt-4">
        <h1>This experiment does not exist.</h1>
        <p>
          No experiment could be found for this URL. Please check the URL and
          try again.
        </p>
      </Container>
    );
  }

  // Show error if user doesn't have permission
  if (!hasPermission) {
    return (
      <Container className="text-center mt-4">
        <h1>You do not have permissions to view this experiment.</h1>
        <p>
          You are not a collaborator on this experiment, or you do not have the
          required permissions to view it.
        </p>
        <p>
          Contact the experiment owner to request access, or check the URL to
          ensure you are viewing the correct experiment.
        </p>
      </Container>
    );
  }

  // If everything is fine, render the children (the actual experiment content)
  return <>{children}</>;
};

export default ExperimentAccessError;
