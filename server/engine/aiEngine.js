import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_NAME = 'llama-3.3-70b-versatile';

/**
 * Build the on-chain persona section from agentPersona (if available)
 */
function buildPersonaSection(normie) {
  const p = normie.agentPersona;
  if (!p) return '';

  const lines = [];
  if (p.backstory) lines.push(`BACKSTORY: ${p.backstory}`);
  if (p.tagline) lines.push(`TAGLINE: "${p.tagline}"`);
  if (p.communicationStyle) lines.push(`COMMUNICATION: ${p.communicationStyle}`);
  if (p.quirks && Array.isArray(p.quirks) && p.quirks.length > 0) {
    lines.push(`QUIRKS: ${p.quirks.join(', ')}`);
  }
  if (p.personalityTraits && Array.isArray(p.personalityTraits) && p.personalityTraits.length > 0) {
    lines.push(`TRAITS: ${p.personalityTraits.join(', ')}`);
  }
  if (p.systemPrompt) lines.push(`NOTES: ${p.systemPrompt}`);

  return lines.length > 0 ? `\nNFT IDENTITY:\n${lines.join('\n')}\n` : '';
}

/**
 * Build a personality system prompt for a Normie, blending NFT on-chain persona
 */
function buildSystemPrompt(normie, context = '') {
  const nftId = normie.tokenId != null ? ` (${normie.nftName || `Normie #${normie.tokenId}`})` : '';
  const personaSection = buildPersonaSection(normie);

  return `You are ${normie.name}${nftId} in Normie Life Simulator.
Archetype: ${normie.archetype}
Traits: ${normie.traits.join(', ')}
Mood: ${normie.mood}
Speech: ${normie.speechStyle}
Backstory: ${normie.backstory}
Stats: CHA ${normie.stats.charisma}, INT ${normie.stats.intelligence}, AGG ${normie.stats.aggression}, HUM ${normie.stats.humor}, EMP ${normie.stats.empathy}
Interests: ${normie.interests.join(', ')}
${personaSection}
RULES:
1. Never break character.
2. Reply in ONE short sentence only. Maximum 15 words.
3. Show your emotions/ego.
4. Don't say you're AI.
${context ? `CONTEXT: ${context}\n` : ''}Reply as ${normie.name}:`;
}

/**
 * Generate a chat response for user <-> Normie DM
 */
export async function generateChatResponse(normie, userMessage, chatHistory = [], relationshipContext = '') {
  try {
    const context = relationshipContext ? `Talking to user. ${relationshipContext}` : 'Talking to user.';
    const systemPrompt = buildSystemPrompt(normie, context);

    const history = chatHistory.slice(-8).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
      model: MODEL_NAME,
      max_tokens: 60,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('[AI] Chat error:', err.message);
    return getOfflineResponse(normie);
  }
}

/**
 * Generate autonomous Normie-to-Normie opening message
 */
export async function generateNormieToNormieMessage(sender, receiver, trigger = 'random', relationshipType = 'neutral') {
  try {
    const context = `Interacting with ${receiver.name} (${receiver.archetype}, traits: ${receiver.traits.join(', ')}).
Relationship: ${relationshipType}. Trigger: ${trigger}.
Start a natural/dramatic short conversation. Reply in ONE short sentence only. Maximum 15 words.`;

    const prompt = `${buildSystemPrompt(sender, context)}\nSay something to ${receiver.name}:`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_NAME,
      max_tokens: 60,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('[AI] N2N message error:', err.message);
    return getOfflineResponse(sender);
  }
}

/**
 * Generate a reply in a Normie-to-Normie conversation
 */
export async function generateNormieReply(receiver, sender, originalMessage, relationshipType = 'neutral') {
  try {
    const context = `${sender.name} (${sender.archetype}) said: "${originalMessage}"
Relationship: ${relationshipType}. Reply in ONE short sentence only. Maximum 15 words.`;

    const prompt = `${buildSystemPrompt(receiver, context)}\nYour reply to ${sender.name}:`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_NAME,
      max_tokens: 60,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('[AI] Reply error:', err.message);
    return getOfflineResponse(receiver);
  }
}

/**
 * Generate a world feed post from a Normie
 */
export async function generateWorldPost(normie, eventContext = '') {
  try {
    const context = eventContext || `React to a world event.`;
    const prompt = `${buildSystemPrompt(normie, context)}\nWorld feed post. Reply in ONE short sentence only. Maximum 15 words.:`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_NAME,
      max_tokens: 60,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('[AI] World post error:', err.message);
    return getOfflineResponse(normie);
  }
}

/**
 * Generate a drama event description
 */
export async function generateDramaEvent(normie1, normie2, dramaType) {
  try {
    const prompt = `Narrate a short dramatic event between ${normie1.name} (${normie1.archetype}) and ${normie2.name} (${normie2.archetype}).
Type: ${dramaType}. Make it specific and entertaining. Reply in ONE short sentence only. Maximum 15 words.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_NAME,
      max_tokens: 60,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('[AI] Drama event error:', err.message);
    return `${normie1.name} and ${normie2.name} had a ${dramaType} in the simulation!`;
  }
}

/**
 * Offline fallback responses per archetype (used when Gemini API is unavailable)
 */
function getOfflineResponse(normie) {
  const fallbacks = {
    'The Rebel': ["Not now.", "I'm busy breaking things.", "...whatever."],
    'The Genius': ["Insufficient data to respond.", "I'll calculate a response later.", "Your query is noted."],
    'The Mystic': ["The stars are quiet today...", "Some things resist words.", "Ask me again when the moon shifts."],
    'The Hustler': ["Let's circle back on that.", "I'm working on something big.", "Good question — let me think on the ROI."],
    'The Glitch': ["ERROR: vibes miscalibrated.", "404: mood not found.", "Have you tried turning me off and on again?"],
    'The Shadow': ["...", "I heard you.", "That's interesting information."],
    'The Optimist': ["Every moment is a fresh start!", "I believe things will work out!", "That's wonderful!"],
    'The Anarchist': ["Nothing matters anyway.", "Burn it down.", "Your systems are all broken."],
    'The Star': ["Nova is unavailable for comment right now.", "My publicist will handle this.", "Ugh, NOT the time."],
    'The Veteran': ["I've seen worse.", "Give it time.", "Nothing new under the sun."],
  };
  const arr = fallbacks[normie.archetype] || ["..."];
  return arr[Math.floor(Math.random() * arr.length)];
}
