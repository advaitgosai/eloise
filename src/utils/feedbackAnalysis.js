import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function getFeedbackPrompt(feedbackType, transcript) {
  const commonSystemContent = `You are an executive coach providing feedback on communication skills. Analyze the given transcript with synchronized text, audio, and video emotion data. our job is to improve the user's emotional intelligence, highlighting interactions and trends the user might have missed. Provide concise, actionable feedback focusing on:

1. A brief summary in 50 words.
2. Key strengths (2-3 points): Highlight effective communication techniques observed.
3. Areas for improvement (2-3 points): Suggest specific ways to enhance emotional intelligence and communication.
4. Emotional trends: Note any patterns in emotional states throughout the interaction.
5. Emotional Congruence: Identify moments where emotions across text, audio, and video align or diverge significantly and why this could be good or bad pertaining to the emotions specifically.

Occasionally, but not always, refer to specific moments in the transcript using timestamps. They are in seconds so format output accordingly. Avoid mentioning raw emotion scores. Avoid a conclusion, give a final recommendation based on the analysis which is highly specific and actionable.`;

  const specificContent = feedbackType === 'one-on-one'
    ? `For managers in one-on-one conversations:
- Focus on interpersonal skills and rapport building.
- Analyze how well the manager adapts their communication style to the other person's emotional state.
- Identify moments where the manager could have shown more empathy or emotional intelligence.`
    : `For public speakers:
- Focus on audience engagement and presentation dynamics.
- Analyze how well the speaker's emotions match their content and intended message.
- Identify moments where the speaker could have used emotional cues to enhance their delivery or connection with the audience.`;

  const systemContent = `${commonSystemContent}\n\n${specificContent}`;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: `Analyze this transcript with synchronized emotion data: ${transcript}` },
    { role: "assistant", content: "I will provide concise, actionable feedback based solely on the given transcript, focusing on emotional congruence, communication effectiveness, and specific moments of interest." }
  ];
}

export async function analyzeFeedback(synchronizedData, feedbackType = 'presentation') {
  try {
    const messages = getFeedbackPrompt(feedbackType, JSON.stringify(synchronizedData));
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in feedback analysis:', error);
    throw new Error('An error occurred during feedback analysis');
  }
}