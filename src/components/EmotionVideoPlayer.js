import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader } from './ui/Card';
// import { Progress } from './ui/Progress';
import { parseEmotionData } from '../utils/parseEmotionData';
import { getColorForEmotion } from '../utils/colorUtils';
import FeedbackAnalysis from './FeedbackAnalysis';

const EmotionVideoPlayer = () => {
  const [videoTime, setVideoTime] = useState(0);
  const [emotionData, setEmotionData] = useState([]);
  const [currentEmotions, setCurrentEmotions] = useState({
    audio: [],
    video: []
  });
  const videoRef = useRef(null);

  const colorMap = useMemo(() => new Map(), []);

  const videoTitle = "Jack's Presentation.mp4";

  useEffect(() => {
    fetch('/emotion_data.txt')
      .then(response => response.text())
      .then(text => {
        const parsedData = parseEmotionData(text);
        setEmotionData(parsedData);
      });
  }, []);

  useEffect(() => {
    if (emotionData.length > 0 && videoTime) {
      const currentData = emotionData.find(data => 
        videoTime >= data.begin && videoTime < data.end
      );
      
      if (currentData) {
        const currentVideoEmotions = currentData.videoEmotions
          .filter(ve => ve.time <= videoTime)
          .sort((a, b) => b.time - a.time)[0]?.emotions || [];

        setCurrentEmotions({
          audio: currentData.audioEmotions,
          video: currentVideoEmotions
        });
      }
    }
  }, [emotionData, videoTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoTime(videoRef.current.currentTime);
    }
  };

  const EmotionBar = ({ emotion, maxScore }) => (
    <div className="flex items-center mb-1">
      <div className="w-20 text-xs font-medium truncate" title={emotion.name}>{emotion.name}</div>
      <div className="flex-grow bg-gray-200 rounded-full h-2 mx-2">
        <div
          className="h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${(emotion.score / maxScore) * 100}%`,
            backgroundColor: getColorForEmotion(emotion.name, colorMap)
          }}
        ></div>
      </div>
      <div className="w-12 text-xs text-right">{(emotion.score * 100).toFixed(0)}%</div>
    </div>
  );

  const EmotionSection = ({ title, emotions }) => {
    const maxScore = Math.max(...emotions.map(e => e.score), 1);
    return (
      <Card className="mb-4 bg-white shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </CardHeader>
        <CardContent className="px-3 py-2">
          {emotions.map((emotion, index) => (
            <EmotionBar key={index} emotion={emotion} maxScore={maxScore} />
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-xl font-semibold text-eloise-blue">{videoTitle}</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            controls
            className="w-full rounded-lg shadow-md"
            style={{ maxHeight: '400px' }}
          >
            <source src="/your-video-file.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="col-span-1 space-y-4">
          <EmotionSection title="Audio Emotions" emotions={currentEmotions.audio} />
          <EmotionSection title="Video Emotions" emotions={currentEmotions.video} />
        </div>
      </div>
      <div className="mt-4">
        <FeedbackAnalysis synchronizedData={emotionData} />
      </div>
    </div>
  );
};



export default EmotionVideoPlayer;