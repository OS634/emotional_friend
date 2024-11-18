import React, { useEffect, useRef } from 'react';

interface EmotionDetectionProps {
  onEmotionDetected: (emotion: string) => void;
}

const EmotionDetection: React.FC<EmotionDetectionProps> = ({ onEmotionDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeCamera();
    return () => stopCamera();
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        startEmotionDetection();
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startEmotionDetection = () => {
    setInterval(detectEmotion, 5000);
  };

  const detectEmotion = async () => {
    if (!videoRef.current || !videoRef.current.videoWidth) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context error');

      ctx.drawImage(videoRef.current, 0, 0);
      
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8)
      );

      const formData = new FormData();
      formData.append('image', blob);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/detect-emotion`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Emotion detection failed');

      const data = await response.json();
      if (data.emotion) {
        onEmotionDetected(data.emotion.emotion);
      }
    } catch (err) {
      console.error('Emotion detection error:', err);
    }
  };

  // Return the video element with position absolute and opacity 0 to completely hide it
  return (
    <div style={{ 
      position: 'absolute', 
      width: '1px', 
      height: '1px', 
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ opacity: 0, position: 'absolute' }}
      />
    </div>
  );
};

export default EmotionDetection;