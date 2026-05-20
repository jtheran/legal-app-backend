import { OpenAI } from 'openai';
import config from './config';

const embeddingClient = new OpenAI({
    baseURL: config.LMSTUDIO_URL,
    apiKey: config.LMSTUDIO_API_KEY,
});

export default embeddingClient;