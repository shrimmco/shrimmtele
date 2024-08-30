import React, { useState, useRef, useCallback } from 'react';
import { Alert } from 'reactstrap';
import { supabase } from '../supabaseClient';
import { Camera } from 'react-camera-pro';
import styled from 'styled-components';

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
  width: 80px;
  height: 80px;
  background-color: white;
  border-radius: 50%;
  border: 5px solid #ccc;
  position: absolute;
  bottom: 10px;
transform: translate(-50%,-50%);
  left: 50%;
  cursor: pointer;
  transition: background-color 0.3s;

  &:active {
    background-color: #ddd;
  }
`;

const CodeAlert = styled(Alert)`
  position: absolute;
  bottom: 50%;
  width: 80%;
  left: 10%;
  text-align: center;
`;

const PhoneCameraUpload = () => {
    const [code, setCode] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const cameraRef = useRef(null);

    const generateCode = useCallback(() => {
        return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit code
    }, []);

    const handleCapture = useCallback(async () => {
        if (cameraRef.current) {
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
            }
        }
    }, [generateCode]);

    return (
        <CameraContainer>
            <Camera
                ref={cameraRef}
                idealFacingMode="environment"
                style={{ width: '100%', height: '100%' }}
            />
            <div className="camera-controls">
                <CaptureButton onClick={handleCapture} />
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
