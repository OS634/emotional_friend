import React, { useEffect, useRef, useState } from 'react';

interface EmotionDetectionProps {
  onEmotionDetected: (emotion: string) => void;
}

interface EmotionResponse {
  emotion: {
    emotion: string;
    confidence: number;
  };
}

const EmotionDetection: React.FC<EmotionDetectionProps> = ({ onEmotionDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          startEmotionDetection();
        }
      } catch (err) {
        setError('Error accessing camera. Please check permissions.');
        console.error('Error accessing camera:', err);
      }
    };

    const startEmotionDetection = () => {
      // Run emotion detection every 5 seconds
      const detectionInterval = setInterval(detectEmotion, 5000);
      return () => clearInterval(detectionInterval);
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detectEmotion = async () => {
    if (!videoRef.current || !videoRef.current.videoWidth || isDetecting) {
      return;
    }

    setIsDetecting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Capture current frame
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8)
      );

      // Create form data
      const formData = new FormData();
      formData.append('image', blob);

      // Send to backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/detect-emotion`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to detect emotion');
      }

      const data: EmotionResponse = await response.json();
      
      if (data.emotion) {
        onEmotionDetected(data.emotion.emotion);
      }

    } catch (err) {
      console.error('Error in emotion detection:', err);
      // Don't update error state to avoid UI clutter
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="video-container">
      {error ? (
        <div className="camera-error">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="emotion-detection-video"
          />
          {isDetecting && (
            <div className="emotion-detecting">
              Detecting emotion...
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmotionDetection;