import React, { useState, useRef, useEffect } from 'react';
import { Alert } from 'reactstrap';
import { supabase } from '../supabaseClient';
import '../assets/css/camera.css'; // Import custom styles

const PhoneCameraUpload = () => {
  const [code, setCode] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Continuously draw the video frame on the canvas
        const drawFrame = () => {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame); // Keep drawing frames
        };

        drawFrame(); // Start drawing frames
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initCamera();

    // Stop the stream when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit code
  };

  const handleCapture = async () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg');
    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `${Date.now()}.jpg`;
    const uniqueCode = generateCode();

    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Save the code and image name in a separate database table
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
  };

  return (
    <div className="camera-container">
      <canvas ref={canvasRef} className="camera-canvas"></canvas>

      <div className="camera-controls">
        <div className="capture-button" onClick={handleCapture}></div>
      </div>

      {uploadSuccess && (
        <Alert color="success" className="mt-3 code-alert">
          Image uploaded successfully! Your code is <strong>{code}</strong>
        </Alert>
      )}
    </div>
  );
};

export default PhoneCameraUpload;
