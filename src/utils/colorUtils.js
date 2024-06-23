export const generatePastelColor = (seed) => {
    const hue = Math.abs(seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)) % 360;
    return `hsl(${hue}, 70%, 80%)`;
  };
  
  export const getColorForEmotion = (emotion, colorMap) => {
    if (!colorMap.has(emotion)) {
      colorMap.set(emotion, generatePastelColor(emotion));
    }
    return colorMap.get(emotion);
  };