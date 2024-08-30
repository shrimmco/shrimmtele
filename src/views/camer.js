import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'reactstrap';
import { supabase } from '../supabaseClient';
import { Camera } from 'react-camera-pro';
import styled from 'styled-components';
import { FaCameraRotate } from 'react-icons/fa6'; // Import rotate icon
import { Spinner } from 'reactstrap'; // Import spinner

const CameraContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  overflow: hidden;
`;

const CaptureButton = styled.div`
  height:10%;
  aspect-ratio:1;
  background-color: ${({ isProcessing }) => (isProcessing ? '#ddd' : 'white')};
  border-radius: 50%;
  border: 5px solid ${({ isProcessing }) => (isProcessing ? 'red' : '#ccc')};
  cursor: ${({ isProcessing }) => (isProcessing ? 'default' : 'pointer')};
   position: absolute;
  bottom: 15%;
  left: 50%;
  transform:translate(-50%,-50%);
  transition: background-color 0.3s;

  &:active {
    background-color: ${({ isProcessing }) => (isProcessing ? '#ddd' : '#ddd')};
  }
`;

const RotateButton = styled.div`
  position: absolute;
  bottom: 25%;
  right: 40px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  aspect-ratio:1;
  height: 5%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform:translate(-50%,-50%);
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }

  svg {
    color: white;
    font-size: 140%;
  }
`;

const CodeAlert = styled(Alert)`
  position: absolute;
  bottom: 100px;
  width: 80%;
  left: 10%;
  text-align: center;
`;

const PhoneCameraUpload = () => {
    const [code, setCode] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // State for processing indicator
    const [facingMode, setFacingMode] = useState('environment'); // State for camera orientation
    const cameraRef = useRef(null);

    const generateCode = useCallback(() => {
        return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit code
    }, []);
    useEffect(() => { }, [facingMode])

    const handleCapture = useCallback(async () => {
        if (cameraRef.current) {
            setIsProcessing(true); // Set processing state to true
            try {
                const imageSrc = cameraRef.current.takePhoto();
                const response = await fetch(imageSrc);
                const blob = await response.blob();
                const fileName = `${Date.now()}.jpg`;
                const uniqueCode = generateCode();

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, blob, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (error) throw error;

                const { error: dbError } = await supabase
                    .from('image_codes')
                    .insert([{ image_name: fileName, code: uniqueCode }]);

                if (dbError) throw dbError;

                setCode(uniqueCode);
                setUploadSuccess(true);
            } catch (error) {
                console.error('Error uploading image:', error.message);
                setUploadSuccess(false);
            } finally {
                setIsProcessing(false); // Reset processing state
            }
        }
    }, [generateCode]);

    const handleRotateCamera = useCallback(() => {
        setFacingMode((facingMode) => (facingMode === 'environment' ? 'user' : 'environment'));
    }, []);

    return (
        <CameraContainer>
            <Camera
                ref={cameraRef}
                facingMode={facingMode}
                style={{ width: '100%', height: '100%' }}
            />
            <div className="camera-controls">
                <CaptureButton onClick={handleCapture} isProcessing={isProcessing}>
                    {isProcessing ? <Spinner size="sm" color="blue" /> : null}
                </CaptureButton>
                <RotateButton onClick={handleRotateCamera}>
                    <FaCameraRotate />
                </RotateButton>
            </div>

            {uploadSuccess && (
                <CodeAlert color="success" className="mt-3">
                    Image uploaded successfully! Your code is <strong>{code}</strong>
                </CodeAlert>
            )}
        </CameraContainer>
    );
};

export default PhoneCameraUpload;
