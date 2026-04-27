import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'what', 'which', 'our', 'are', 'was', 'from', 'have', 'has', 'been', 'will', 'your', 'you', 'about', 'into', 'who', 'why', 'how', 'when', 'where', 'can', 'could', 'should', 'would', 'is', 'in', 'on', 'of', 'to', 'a', 'an', 'as', 'at', 'by', 'it', 'be', 'or', 'we', 'do', 'does', 'did'
]);

let cachedBrain;
let cachedChunks;

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function splitLongText(text, maxChars = 1200) {
  if (text.length <= maxChars) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const parts = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxChars && current) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function buildChunks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const chunks = [];
  const headings = [];
  let buffer = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    buffer = [];

    if (!text) return;

    const sectionPath = headings.length > 0 ? headings.join(' > ') : 'WF Synthetic Brain';
    for (const piece of splitLongText(text)) {
      chunks.push({
        sectionPath,
        text: piece.trim()
      });
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);

    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      headings.splice(level - 1);
      headings[level - 1] = headingMatch[2].trim();
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return chunks;
}

function scoreChunk(chunk, terms) {
  const haystack = `${chunk.sectionPath}\n${chunk.text}`.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (haystack.includes(term)) {
      score += term.length > 5 ? 2 : 1;
    }
  }

  return score;
}

async function loadBrainChunks() {
  if (cachedChunks) return cachedChunks;

  if (!cachedBrain) {
    const brainPath = path.join(__dirname, '..', 'wf-synthetic-brain.md');
    cachedBrain = await fs.readFile(brainPath, 'utf8');
  }

  cachedChunks = buildChunks(cachedBrain);
  return cachedChunks;
}

function buildFallbackAnswer(question, topChunks) {
  const top = topChunks[0];

  if (!top) {
    return {
      answer: `I could not find relevant context for: ${question}`,
      confidence: 0.2,
      citations: []
    };
  }

  return {
    answer: `I could not reach the LLM, but the most relevant context I found is:\n\n${top.text}`,
    confidence: 0.45,
    citations: topChunks.map((chunk) => ({
      sectionPath: chunk.sectionPath,
      excerpt: chunk.text.slice(0, 240)
    }))
  };
}

async function callGroq(question, topChunks) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    return buildFallbackAnswer(question, topChunks);
  }

  const contextBlocks = topChunks.map((chunk, index) => `[C${index + 1}] ${chunk.sectionPath}\n${chunk.text}`).join('\n\n');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: Number(process.env.LLM_TEMPERATURE ?? 0.1),
      max_tokens: Number(process.env.LLM_MAX_OUTPUT_TOKENS ?? 1200),
      messages: [
        {
          role: 'system',
          content: 'You are the Wellness Forever AI agent. Answer using only the provided context. Be concise, concrete, and cite the relevant chunks using bracket labels like [C1]. If the context is insufficient, say so clearly.'
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nContext:\n${contextBlocks}\n\nReturn a helpful answer and mention the chunk labels that support it.`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const payload = await response.json();
  const answer = payload?.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error('Empty Groq response');
  }

  const confidence = Math.min(0.98, 0.5 + topChunks.length * 0.05);

  return {
    answer,
    confidence,
    citations: topChunks.map((chunk) => ({
      sectionPath: chunk.sectionPath,
      excerpt: chunk.text.slice(0, 240)
    }))
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body || {};

    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const chunks = await loadBrainChunks();
    const terms = tokenize(question);

    const ranked = chunks
      .map((chunk) => ({
        ...chunk,
        score: scoreChunk(chunk, terms)
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((left, right) => right.score - left.score || right.text.length - left.text.length)
      .slice(0, 8);

    const selectedChunks = ranked.length > 0 ? ranked : chunks.slice(0, 5);
    const result = await callGroq(question.trim(), selectedChunks);

    return res.status(200).json({
      question: question.trim(),
      answer: result.answer,
      confidence: result.confidence,
      citations: result.citations
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to answer question',
      message: error.message
    });
  }
}