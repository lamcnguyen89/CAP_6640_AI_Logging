import React, { useState, useCallback } from "react";
import { Stack, Row, Col, Modal, Container, Button, Spinner, Form, InputGroup, Image } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import '../../styles/App.css'
import uploadIcon from '../../assets/upload-icon.png'

// Source: https://www.digitalocean.com/community/tutorials/react-react-dropzone
// Source: https://www.youtube.com/watch?v=8uChP5ivQ1Q
// React DropZone Accept Format: https://stackoverflow.com/questions/72403205/react-dropzone-accepts-all-uploaded-file-types-instead-of-specified-file-types



interface DragAndDropProps {
    fileExtension: string;
    //setFileUpload: File;
    //setUploadStatus: any;
    setFileUpload: (file: File) => void;
    setUploadStatus: (status: string) => void
}

const DragAndDrop: React.FC<DragAndDropProps> = ({
    fileExtension,
    setFileUpload,
    setUploadStatus

}) => {

    const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

    // Function to do when file is dropped in.
    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log("Accepted file Extension: ", fileExtension);
        const file = acceptedFiles[0];
        if (!file) return;

        setFileUpload(file);
        setUploadStatus("uploading");

        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    }, [setFileUpload, setUploadStatus]);

    // Validator to ensure file is of correct type
    const customValidator = (file) => {
        //const ext = file.name.split('.').pop().toLowerCase();
        const extArray = file.name.split('.');
        const ext = extArray[extArray.length - 1]?.toLowerCase();
        if (ext !== fileExtension.toLowerCase()) {
            return {
                code: "invalid-extension",
                message: `Only .${fileExtension} files are allowed`,
            };
        }
        return null;
    };

    const {
        getRootProps,
        getInputProps
    } = useDropzone({
        accept: {
            // "application/octet-stream": [`.${fileExtension}`]
            '': [`.${fileExtension}`]
        },
        validator: customValidator,
        onDrop,

    });

    // Returns a styled element. Anywhere on this element can be clicked or have a file dragged to it
    return (
        <>
            <Container className="draganddrop" {...getRootProps()}>
                <input {...getInputProps()} />
                <Image src={uploadIcon} />
                <Container><b>Drag and drop or <span style={{ color: "#1C7CED" }}>Choose file</span> to upload and replace</b></Container>
                {/* Optionally show preivew*/}
                {/*<img src={preview as strung} alt="Preview" />*/}
            </Container>
        </>

    )
}

export default DragAndDrop;