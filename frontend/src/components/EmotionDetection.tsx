import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface EmotionDetectionProps {
  onEmotionDetected: (emotion: string) => void;
}

const EmotionDetection: React.FC<EmotionDetectionProps> = ({ onEmotionDetected }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        setIsStreaming(true);
        setError('');
        startEmotionDetection();
      }
    } catch (err) {
      setError('Could not access camera. Please ensure camera permissions are granted.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  };

  const startEmotionDetection = async () => {
    // Placeholder for emotion detection logic
    // In a real implementation, you would:
    // 1. Capture frames from video at regular intervals
    // 2. Process frames through an emotion detection model
    // 3. Call onEmotionDetected with the detected emotion
    
    const mockEmotions = ['happy', 'sad', 'neutral', 'angry'];
    setInterval(() => {
      const randomEmotion = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
      onEmotionDetected(randomEmotion);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-100 rounded-lg shadow">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 bg-black rounded-lg"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {isStreaming && (
        <button
          onClick={stopCamera}
          className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop Camera
        </button>
      )}
    </div>
  );
};

export default EmotionDetection;