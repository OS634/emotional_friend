import React, { useEffect, useRef } from 'react';

interface EmotionDetectionProps {
  onEmotionDetected: (emotion: string) => void;
}

const EmotionDetection: React.FC<EmotionDetectionProps> = ({ onEmotionDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        console.error('Error accessing camera:', err);
      }
    };

    const startEmotionDetection = () => {
      const mockEmotions = ['happy', 'sad', 'neutral', 'angry'];
      setInterval(() => {
        const randomEmotion = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
        onEmotionDetected(randomEmotion);
      }, 3000);
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onEmotionDetected]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ display: 'none' }}
    />
  );
};

export default EmotionDetection;