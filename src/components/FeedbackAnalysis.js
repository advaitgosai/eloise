import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { analyzeFeedback } from '../utils/feedbackAnalysis';
import ReactMarkdown from 'react-markdown';

const FeedbackAnalysis = ({ synchronizedData }) => {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyzeFeedback = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeFeedback(synchronizedData);
      setFeedback(result);
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      setFeedback('An error occurred while analyzing the feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-eloise-blue">Communication Analysis</h3>
        <Button 
          onClick={handleAnalyzeFeedback} 
          disabled={isLoading}
          className="bg-eloise-pink text-white px-3 py-1 rounded-md text-sm hover:bg-opacity-90 transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </CardHeader>
      <CardContent className="px-4 py-3 max-h-64 overflow-y-auto">
        {feedback ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">
            Click the analyze button to get feedback on your communication.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackAnalysis;