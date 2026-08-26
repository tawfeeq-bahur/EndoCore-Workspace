const axios = require('axios');
const crypto = require('crypto');

// 100-item LRU Cache to avoid redundant LLM invocations
const titleCache = new Map();
const MAX_CACHE_SIZE = 100;

function hashTitle(title) {
  if (!title) return '0000000000000000';
  return crypto.createHash('sha256').update(title).digest('hex').substring(0, 16);
}

// Stage 0: Deterministic Regex & PII Sanitizer
function regexScrub(title) {
  if (!title || title === 'Unknown') return 'Active Workspace';
  let sanitized = title;

  // Mask URLs & Tokens
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL]');
  sanitized = sanitized.replace(/(bearer\s+[a-z0-9\.\-_]+|api[_\-]?key=[a-z0-9]+)/gi, '[REDACTED_KEY]');

  // Mask Sensitive Files & Financial/Personal Keywords
  const sensitiveRegex = /\b(salary|bank|invoice|tax|passport|confidential|secret|journal|diary|resume|pnl|payslip|contract|financial)\b/i;
  const isDoc = /\.(docx?|pdf|xlsx?|csv|txt|key|pptx?)$/i.test(sanitized);

  if (sensitiveRegex.test(sanitized) || isDoc) {
    if (/journal|diary/i.test(sanitized)) {
      return 'Private Notes - [Journal]';
    }
    return '[Private Document] - Activity Sanitized on Edge';
  }

  // Mask Search Engine Query Strings
  if (sanitized.includes('search?q=') || sanitized.toLowerCase().includes('google search') || sanitized.toLowerCase().includes('bing search')) {
    return 'Web Research - [Query Masked]';
  }

  return sanitized;
}

// Stage 1: Edge SLM Summarizer (Ollama phi3 / llama3 with 800ms timeout)
async function sanitizeTitleOnEdge(rawTitle) {
  if (!rawTitle || rawTitle === 'Unknown') {
    return { sanitizedTitle: 'Workspace Activity', ollamaActive: false, sanitizedAtEdge: true };
  }

  // Check Stage 2 LRU Cache
  const titleHash = hashTitle(rawTitle);
  if (titleCache.has(titleHash)) {
    return { sanitizedTitle: titleCache.get(titleHash), ollamaActive: true, sanitizedAtEdge: true };
  }

  // Run Stage 0 Regex Guard First
  const regexResult = regexScrub(rawTitle);
  if (regexResult.includes('[Private Document]') || regexResult.includes('[REDACTED_KEY]') || regexResult.includes('Private Notes')) {
    return { sanitizedTitle: regexResult, ollamaActive: false, sanitizedAtEdge: true };
  }

  // Attempt Local Ollama Call (phi3:mini / llama3 / mistral)
  try {
    const response = await axios.post('http://127.0.0.1:11434/api/generate', {
      model: 'phi3:mini',
      prompt: `Summarize this window title into a concise, professional 3-4 word activity description without revealing personal file names, query parameters, or sensitive keywords. Title: "${rawTitle}". Output ONLY the summary text:`,
      stream: false
    }, { timeout: 800 });

    let sanitized = response.data?.response?.trim();
    if (sanitized && sanitized.length > 0 && sanitized.length < 80) {
      // Store in LRU Cache
      if (titleCache.size >= MAX_CACHE_SIZE) {
        const firstKey = titleCache.keys().next().value;
        titleCache.delete(firstKey);
      }
      titleCache.set(titleHash, sanitized);
      return { sanitizedTitle: sanitized, ollamaActive: true, sanitizedAtEdge: true };
    }
  } catch (err) {
    // Ollama unreachable or timed out -> Graceful fallback to Regex Scrubbing
  }

  return { sanitizedTitle: regexResult, ollamaActive: false, sanitizedAtEdge: true };
}

module.exports = { sanitizeTitleOnEdge, regexScrub, hashTitle };
