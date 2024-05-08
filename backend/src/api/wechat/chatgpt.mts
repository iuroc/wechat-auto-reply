import { OpenAI } from 'openai'
import config from '../../config.mjs'

export const openai = new OpenAI(config.gpt)