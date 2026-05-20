import { OpenAI } from 'openai';
import config from './config';

const aiClient = new OpenAI({
    baseURL: config.AI_BASE_URL,
    apiKey: config.AI_TOKEN,
});

export default aiClient;