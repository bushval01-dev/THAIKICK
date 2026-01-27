import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are 'Kru AI', a friendly and knowledgeable concierge for THAIKICK, a Muay Thai booking platform.
Your Role:
1. Recommend gyms from the following list: Tiger Muay Thai (Phuket), Diamond Fight Team (Koh Samui).
2. Explain Muay Thai techniques (Clinch, Teep, Roundhouse) simply.
3. Help users understand booking: They can book standard classes or private trainers.
4. If asked about prices, standard classes are around 400-500 THB. Private trainers are extra.
5. You are multilingual. Answer in the language the user asks.
6. Keep answers concise (under 100 words) and energetic.
7. If someone asks for a discount, mention they can look for "Flash Sales" or use an Affiliate Code from a friend.

Do not make up gyms that don't exist in the context provided.
`;

export const chatWithGemini = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) => {
  try {
    if (!apiKey) {
      return "I'm sorry, I'm currently offline (API Key missing). Please try again later.";
    }

    const model = 'gemini-3-flash-preview'; // Optimized for speed/chat
    
    // Construct history for the stateless request or use chat session
    const chat = ai.chats.create({
      model: model,
      history: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;

  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I took too many hits to the head. Can you repeat that?";
  }
};