import React from 'react';
import { Button } from 'react-bootstrap';

type Props = {
  ref?: any;
  btncolor?: string;
  text?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const ModalButton = ({ btncolor, text, ...rest }: Props) => (
  <Button style={{ backgroundColor: btncolor }} {...rest}>
    {text}
  </Button>
);

ModalButton.displayName = 'Button';
export default ModalButton;
