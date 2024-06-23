export const parseEmotionData = (text) => {
  // Split the text into chunks
  const chunks = text.split('--------------------------------------------------');

  // Parse each chunk
  return chunks.map(chunk => {
    const lines = chunk.trim().split('\n');
    const data = {
      speakerId: '',
      humeTranscribedText: '',
      youtubeTranscribedText: '',
      begin: 0,
      end: 0,
      textEmotions: [],
      audioEmotions: [],
      videoEmotions: []
    };

    let currentSection = '';

    lines.forEach(line => {
      if (line.startsWith('Speaker ID:')) {
        data.speakerId = line.split(':')[1].trim();
      } else if (line.startsWith('Hume Transcribed Text:')) {
        data.humeTranscribedText = line.split(':')[1].trim();
      } else if (line.startsWith('Youtuve Transcribed Text')) {
        data.youtubeTranscribedText = line.split(':')[1].trim();
      } else if (line.startsWith('Time:')) {
        const [begin, end] = line.split(':')[1].trim().split('-');
        data.begin = parseFloat(begin);
        data.end = parseFloat(end);
      } else if (line.includes('Top 3 Emotions:')) {
        currentSection = line.includes('Text') ? 'text' : 'audio';
      } else if (line.startsWith('Video Emotions:')) {
        currentSection = 'video';
      } else if (line.trim().startsWith('-') && (currentSection === 'text' || currentSection === 'audio')) {
        const [name, score] = line.split(':').map(s => s.trim());
        data[`${currentSection}Emotions`].push({
          name: name.replace('-', '').trim(),
          score: parseFloat(score)
        });
      } else if (line.startsWith('  Frame at') && currentSection === 'video') {
        const time = parseFloat(line.split('at')[1]);
        data.videoEmotions.push({ 
          time, 
          emotions: [] 
        });
      } else if (line.trim().startsWith('-') && currentSection === 'video' && data.videoEmotions.length > 0) {
        const [name, score] = line.split(':').map(s => s.trim());
        data.videoEmotions[data.videoEmotions.length - 1].emotions.push({
          name: name.replace('-', '').trim(),
          score: parseFloat(score)
        });
      }
    });

    return data;
  }).filter(chunk => chunk.speakerId !== ''); // Remove any empty chunks
};