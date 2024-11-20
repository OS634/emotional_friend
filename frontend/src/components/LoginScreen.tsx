import React from 'react';
import GoogleIcon from '@mui/icons-material/Google';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome to AI Friend Chatbot
            </h1>
            <p className="text-gray-500">
              Your personal AI companion for empathetic conversations
            </p>
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-2">
                <li>Real-time emotion detection</li>
                <li>Personalized conversations</li>
                <li>Secure and private chats</li>
              </ul>
            </div>
            
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 rounded-lg p-3 shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {/* <img 
                src="/api/placeholder/20/20"
                alt="Google" 
                className="w-5 h-5"
              /> */}
                <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;