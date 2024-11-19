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
          width: { ideal: 160 },
          height: { ideal: 120 },
          frameRate: { ideal: 10 }
        } 
      });
      
      const videoTrack = stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        width: { ideal: 160 },
        height: { ideal: 120 }
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
    <div className="w-160 mx-auto p-2 bg-gray-100 rounded-lg shadow">
      <div className="relative">
        <video
          ref={videoRef}
          width={160}
          height={120}
          style={{
            width: '160px',
            height: '120px',
            objectFit: 'cover'
          }}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video bg-black rounded-lg"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
            <button
              onClick={startCamera}
              className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Start</span>
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-xs">
          {error}
        </div>
      )}
      
      {isStreaming && (
        <button
          onClick={stopCamera}
          className="mt-2 w-full px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Stop
        </button>
      )}
    </div>
  );
};

export default EmotionDetection;