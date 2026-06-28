"""Provider-agnostic AI engine for the support chatbot.

One OpenAI-compatible client drives every supported *free* provider — only the
base URL, model and API key differ:

  • groq        → Llama 3.3 70B, very fast, generous free tier  (default)
  • gemini      → Google Gemini via its OpenAI-compatibility endpoint (free tier)
  • openrouter  → many free community models
  • openai      → official OpenAI (paid) or any compatible gateway
  • ollama      → a local model, no key needed

Configure with environment variables (see settings.py): AI_PROVIDER, AI_API_KEY,
AI_MODEL, AI_BASE_URL. If no key is found the views transparently use the
offline keyword fallback in knowledge.py, so the widget always works.
"""
import json
import logging
import os

import requests
from django.conf import settings

from . import knowledge

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 60
STREAM_TIMEOUT = 120
MAX_TOOL_ROUNDS = 4

# provider → (default base_url, default model, api-key env var)
PROVIDER_PRESETS = {
    'groq': ('https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', 'GROQ_API_KEY'),
    'gemini': ('https://generativelanguage.googleapis.com/v1beta/openai', 'gemini-2.0-flash', 'GEMINI_API_KEY'),
    'openrouter': ('https://openrouter.ai/api/v1', 'meta-llama/llama-3.3-70b-instruct:free', 'OPENROUTER_API_KEY'),
    'openai': ('https://api.openai.com/v1', 'gpt-4o-mini', 'OPENAI_API_KEY'),
    'ollama': ('http://localhost:11434/v1', 'llama3.1', 'OLLAMA_API_KEY'),
}

# Message keys we are willing to send upstream (drop provider-specific extras).
_ALLOWED_MSG_KEYS = {'role', 'content', 'tool_calls', 'tool_call_id', 'name'}


class AIError(Exception):
    pass


def get_config():
    provider = (getattr(settings, 'AI_PROVIDER', '') or 'groq').lower()
    base_default, model_default, key_env = PROVIDER_PRESETS.get(provider, PROVIDER_PRESETS['groq'])
    base_url = (getattr(settings, 'AI_BASE_URL', '') or base_default).rstrip('/')
    model = getattr(settings, 'AI_MODEL', '') or model_default
    api_key = getattr(settings, 'AI_API_KEY', '') or os.environ.get(key_env, '')
    return {
        'provider': provider,
        'base_url': base_url,
        'model': model,
        'api_key': api_key,
        'temperature': float(getattr(settings, 'AI_TEMPERATURE', 0.4)),
        'max_tokens': int(getattr(settings, 'AI_MAX_TOKENS', 900)),
    }


def is_enabled():
    """True when a real LLM can be reached (key present, or a local endpoint)."""
    cfg = get_config()
    if cfg['api_key']:
        return True
    return cfg['provider'] == 'ollama' or 'localhost' in cfg['base_url'] or '127.0.0.1' in cfg['base_url']


# ───────────────────────────────────────────────────────── HTTP plumbing ──

def _headers(cfg):
    headers = {'Content-Type': 'application/json'}
    if cfg['api_key']:
        headers['Authorization'] = f"Bearer {cfg['api_key']}"
    if cfg['provider'] == 'openrouter':
        headers['HTTP-Referer'] = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        headers['X-Title'] = 'AutoParts AI Support'
    return headers


def _sanitize(messages):
    clean = []
    for m in messages:
        item = {k: v for k, v in m.items() if k in _ALLOWED_MSG_KEYS and v is not None}
        if 'tool_calls' in item:
            item['tool_calls'] = [{
                'id': tc.get('id'),
                'type': 'function',
                'function': {
                    'name': tc['function']['name'],
                    'arguments': tc['function'].get('arguments', '') or '',
                },
            } for tc in item['tool_calls']]
            # An assistant tool-call turn must still carry a content key.
            item.setdefault('content', '')
        clean.append(item)
    return clean


def _payload(cfg, messages, tools, stream):
    body = {
        'model': cfg['model'],
        'messages': _sanitize(messages),
        'temperature': cfg['temperature'],
        'max_tokens': cfg['max_tokens'],
        'stream': stream,
    }
    if tools:
        body['tools'] = tools
        body['tool_choice'] = 'auto'
    return body


def _post(cfg, messages, tools=None, stream=False):
    url = f"{cfg['base_url']}/chat/completions"
    return requests.post(
        url, headers=_headers(cfg), json=_payload(cfg, messages, tools, stream),
        stream=stream, timeout=STREAM_TIMEOUT if stream else REQUEST_TIMEOUT,
    )


def _run_tool_calls(messages, tool_calls):
    """Append the assistant tool-call turn + each tool result to ``messages``."""
    messages.append({
        'role': 'assistant',
        'content': '',
        'tool_calls': [{
            'id': tc['id'], 'type': 'function',
            'function': {'name': tc['function']['name'], 'arguments': tc['function'].get('arguments', '') or ''},
        } for tc in tool_calls],
    })
    for tc in tool_calls:
        name = tc['function']['name']
        try:
            args = json.loads(tc['function'].get('arguments') or '{}')
        except (json.JSONDecodeError, TypeError):
            args = {}
        result = knowledge.execute_tool(name, args)
        messages.append({
            'role': 'tool',
            'tool_call_id': tc['id'],
            'name': name,
            'content': json.dumps(result, ensure_ascii=False),
        })


# ───────────────────────────────────────────────────── Non-streaming chat ──

def chat(history, system_prompt=None):
    """Run a full tool-calling loop and return the final assistant text.

    ``history`` is a list of {role, content} messages. Pass ``system_prompt`` to
    override the default persona (e.g. the voice-call prompt). Raises AIError on
    transport/API failure so the caller can fall back.
    """
    cfg = get_config()
    messages = [{'role': 'system', 'content': system_prompt or knowledge.build_system_prompt()}] + list(history)
    tools = knowledge.TOOL_SCHEMAS

    for _ in range(MAX_TOOL_ROUNDS):
        resp = _post(cfg, messages, tools=tools, stream=False)
        if resp.status_code >= 400:
            raise AIError(f'{resp.status_code}: {resp.text[:300]}')
        choice = resp.json()['choices'][0]['message']
        tool_calls = choice.get('tool_calls')
        if not tool_calls:
            return (choice.get('content') or '').strip()
        _run_tool_calls(messages, tool_calls)

    # Tool budget exhausted — force a final textual answer.
    resp = _post(cfg, messages, tools=None, stream=False)
    if resp.status_code >= 400:
        raise AIError(f'{resp.status_code}: {resp.text[:300]}')
    return (resp.json()['choices'][0]['message'].get('content') or '').strip()


# ───────────────────────────────────────────────────────── Streaming chat ──

def _iter_sse(resp):
    """Yield parsed JSON chunks from an OpenAI-style SSE stream."""
    for raw in resp.iter_lines(decode_unicode=True):
        if not raw:
            continue
        if raw.startswith('data:'):
            raw = raw[5:].strip()
        if raw == '[DONE]':
            break
        try:
            yield json.loads(raw)
        except json.JSONDecodeError:
            continue


def chat_stream(history, system_prompt=None):
    """Generator yielding assistant text chunks (str) as they are produced.

    Streams real tokens to the user; when the model requests tools mid-stream it
    runs them and continues streaming the grounded answer. Raises AIError before
    any text is yielded if the very first request fails, so the caller can fall
    back cleanly.
    """
    cfg = get_config()
    messages = [{'role': 'system', 'content': system_prompt or knowledge.build_system_prompt()}] + list(history)
    tools = knowledge.TOOL_SCHEMAS

    for round_index in range(MAX_TOOL_ROUNDS):
        resp = _post(cfg, messages, tools=tools, stream=True)
        if resp.status_code >= 400:
            raise AIError(f'{resp.status_code}: {resp.text[:300]}')

        tool_acc = {}        # index → {id, name, arguments}
        produced_text = False
        with resp:
            for chunk in _iter_sse(resp):
                choices = chunk.get('choices') or [{}]
                delta = choices[0].get('delta') or {}
                content = delta.get('content')
                if content:
                    produced_text = True
                    yield content
                for tc in (delta.get('tool_calls') or []):
                    idx = tc.get('index', 0)
                    slot = tool_acc.setdefault(idx, {'id': None, 'function': {'name': '', 'arguments': ''}})
                    if tc.get('id'):
                        slot['id'] = tc['id']
                    fn = tc.get('function') or {}
                    if fn.get('name'):
                        slot['function']['name'] = fn['name']
                    if fn.get('arguments'):
                        slot['function']['arguments'] += fn['arguments']

        if not tool_acc:
            return  # model answered directly; everything was already streamed.

        tool_calls = [
            {'id': v['id'] or f'call_{i}', 'function': v['function']}
            for i, v in sorted(tool_acc.items())
        ]
        _run_tool_calls(messages, tool_calls)
        # On the final permitted round, drop tools to force a textual answer.
        if round_index == MAX_TOOL_ROUNDS - 1:
            tools = None

    # Safety net: one last non-tool streaming pass.
    resp = _post(cfg, messages, tools=None, stream=True)
    if resp.status_code >= 400:
        raise AIError(f'{resp.status_code}: {resp.text[:300]}')
    with resp:
        for chunk in _iter_sse(resp):
            choices = chunk.get('choices') or [{}]
            content = (choices[0].get('delta') or {}).get('content')
            if content:
                yield content
