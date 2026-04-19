import { OpenAI } from 'openai';
import config from './config';

const aiClient = new OpenAI({
    baseURL: config.LMSTUDIO_URL,
    apiKey: config.LMSTUDIO_API_KEY,
});

export default aiClient;