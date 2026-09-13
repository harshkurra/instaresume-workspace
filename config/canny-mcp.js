#!/usr/bin/env node
/**
 * Canny MCP Server — wraps Canny REST API v1 for Claude Code
 *
 * Set CANNY_API_KEY in the environment (via .mcp.json env block).
 * API docs: https://developers.canny.io/api-reference
 *
 * Tools exposed:
 *   canny_list_boards   — list all boards
 *   canny_list_posts    — list posts (filter by board, status, search)
 *   canny_get_post      — fetch a single post by ID
 *   canny_create_post   — create a new feature request post
 */

'use strict';

const https = require('https');
const readline = require('readline');

const API_KEY = process.env.CANNY_API_KEY;

// ── Canny REST helper ────────────────────────────────────────────────────────

function cannyRequest(endpoint, body = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ apiKey: API_KEY, ...body });
    const req = https.request(
      {
        hostname: 'canny.io',
        path: `/api/v1/${endpoint}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(`Canny returned non-JSON: ${raw.slice(0, 200)}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'canny_list_boards',
    description: 'List all Canny boards (product feedback boards) with post counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'canny_list_posts',
    description:
      'List posts on a Canny board. Useful for reading customer feedback and feature requests. ' +
      'Filter by status: open | under review | planned | in progress | complete | closed.',
    inputSchema: {
      type: 'object',
      properties: {
        boardID:  { type: 'string', description: 'Board ID (from canny_list_boards)' },
        status:   { type: 'string', description: 'Filter by post status (optional)' },
        search:   { type: 'string', description: 'Search term (optional)' },
        limit:    { type: 'number', description: 'Max posts to return (default 20, max 100)' },
        skip:     { type: 'number', description: 'Offset for pagination (default 0)' },
      },
    },
  },
  {
    name: 'canny_get_post',
    description: 'Fetch a single Canny post by its ID including full details and comments.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Post ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'canny_create_post',
    description: 'Create a new feature request post on a Canny board.',
    inputSchema: {
      type: 'object',
      properties: {
        boardID:  { type: 'string', description: 'Board ID to post to' },
        authorID: { type: 'string', description: 'Canny user ID of the author' },
        title:    { type: 'string', description: 'Post title (short, descriptive)' },
        details:  { type: 'string', description: 'Full description of the feature request' },
      },
      required: ['boardID', 'authorID', 'title'],
    },
  },
  {
    name: 'canny_list_entries',
    description: 'List changelog entries. Useful for reviewing what has already been announced.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max entries to return (default 10, max 100)' },
        skip:  { type: 'number', description: 'Offset for pagination (default 0)' },
        type:  { type: 'string', description: 'Filter by type: new | improved | fixed (optional)' },
      },
    },
  },
  {
    name: 'canny_create_entry',
    description:
      'Create a new changelog entry (product update / release note). ' +
      'Use type "new" for new features, "improved" for enhancements, "fixed" for bug fixes. ' +
      'Details supports markdown. Pass published: true to publish immediately, or omit to save as draft.',
    inputSchema: {
      type: 'object',
      properties: {
        title:       { type: 'string',  description: 'Short headline for the changelog entry' },
        details:     { type: 'string',  description: 'Full description in markdown (supports **bold**, bullet lists, etc.)' },
        type:        { type: 'string',  description: 'Entry type: new | improved | fixed' },
        published:   { type: 'boolean', description: 'true = publish immediately, false/omit = draft' },
        scheduledFor:{ type: 'string',  description: 'ISO 8601 date string to schedule publishing (optional)' },
        postIDs:     { type: 'array',   items: { type: 'string' }, description: 'Canny post IDs to link to this entry (optional)' },
        labelIDs:    { type: 'array',   items: { type: 'string' }, description: 'Label IDs to attach (optional)' },
      },
      required: ['title', 'type'],
    },
  },
];

// ── Tool handlers ────────────────────────────────────────────────────────────

async function callTool(name, args) {
  if (!API_KEY) throw new Error('CANNY_API_KEY is not set');

  switch (name) {
    case 'canny_list_boards': {
      const res = await cannyRequest('boards/list');
      if (res.error) throw new Error(res.error);
      return (res.boards || []).map((b) => ({
        id: b.id,
        name: b.name,
        postCount: b.postCount,
        url: b.url,
      }));
    }

    case 'canny_list_posts': {
      const { boardID, status, search, limit = 20, skip = 0 } = args;
      const params = { limit, skip };
      if (boardID) params.boardID = boardID;
      if (status)  params.status  = status;
      if (search)  params.search  = search;
      const res = await cannyRequest('posts/list', params);
      if (res.error) throw new Error(res.error);
      return (res.posts || []).map((p) => ({
        id:           p.id,
        title:        p.title,
        status:       p.status,
        score:        p.score,
        commentCount: p.commentCount,
        details:      p.details ? p.details.slice(0, 400) : '',
        tags:         (p.tags || []).map((t) => t.name),
        createdAt:    p.created,
        url:          p.url,
      }));
    }

    case 'canny_get_post': {
      const res = await cannyRequest('posts/retrieve', { id: args.id });
      if (res.error) throw new Error(res.error);
      return res;
    }

    case 'canny_create_post': {
      const res = await cannyRequest('posts/create', args);
      if (res.error) throw new Error(res.error);
      return res;
    }

    case 'canny_list_entries': {
      const { limit = 10, skip = 0, type } = args;
      const params = { limit, skip };
      if (type) params.type = type;
      const res = await cannyRequest('entries/list', params);
      if (res.error) throw new Error(res.error);
      return (res.entries || []).map((e) => ({
        id:          e.id,
        title:       e.title,
        type:        e.type,
        status:      e.status,
        publishedAt: e.publishedAt,
        url:         e.url,
        details:     e.markdownDetails ? e.markdownDetails.slice(0, 300) : '',
        reactionCount: e.reactionCount,
      }));
    }

    case 'canny_create_entry': {
      const { title, details, type, published = false, scheduledFor, postIDs, labelIDs } = args;
      const params = { title, type, published };
      if (details)      params.markdownDetails = details;
      if (scheduledFor) params.scheduledFor    = scheduledFor;
      if (postIDs?.length)  params.postIDs  = postIDs;
      if (labelIDs?.length) params.labelIDs = labelIDs;
      const res = await cannyRequest('entries/create', params);
      if (res.error) throw new Error(res.error);
      return { id: res.id, url: res.url, status: res.status, title: res.title };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP stdio transport ──────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  line = line.trim();
  if (!line) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return; // ignore parse errors
  }

  const { id, method, params } = msg;

  const send = (payload) =>
    process.stdout.write(JSON.stringify(payload) + '\n');

  try {
    let result;

    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'canny-mcp', version: '1.0.0' },
      };
    } else if (method === 'notifications/initialized') {
      return; // one-way notification — no response
    } else if (method === 'tools/list') {
      result = { tools: TOOLS };
    } else if (method === 'tools/call') {
      const output = await callTool(params.name, params.arguments || {});
      result = {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      };
    } else {
      result = {}; // unknown method — return empty result
    }

    if (id !== undefined) send({ jsonrpc: '2.0', id, result });
  } catch (err) {
    if (id !== undefined) {
      send({ jsonrpc: '2.0', id, error: { code: -32000, message: err.message } });
    }
  }
});
