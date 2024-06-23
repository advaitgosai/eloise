// src/App.js
import React from 'react';
import EmotionVideoPlayer from './components/EmotionVideoPlayer';
import logo from './Eloise.png'
import { UploadIcon } from '@heroicons/react/solid';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-eloise-purple shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={logo} alt="Eloise Logo" className="h-8 w-auto mr-3" />
            <h1 className="text-2xl font-bold text-white">Eloise</h1>
          </div>
          <button className="bg-eloise-pink text-white px-4 py-2 rounded-md flex items-center hover:bg-opacity-90 transition-colors">
            <UploadIcon className="h-5 w-5 mr-2" />
            Upload
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <EmotionVideoPlayer />
      </main>
    </div>
  );
}

export default App;
