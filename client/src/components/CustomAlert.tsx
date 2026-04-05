// src/components/CustomAlert.tsx
import React from 'react';
import { Alert, Button, Container, Image } from 'react-bootstrap';
import cancelButton from "../assets/cancel.png";

interface CustomAlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
  onReload?: () => void; // Optional reload function
}

const CustomAlert: React.FC<CustomAlertProps> = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <Container className="custom-alert-container">
      <Alert className="custom-alert" dismissible={false}>
        <span className="alert-message">{message}</span>
        <Button className="custom-close-button" onClick={onClose}>
          <Image src={cancelButton} alt="Close Icon" />
        </Button>
      </Alert>
  </Container>
  );
};

export default CustomAlert;
