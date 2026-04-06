#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const issueId = arg('issue-id');
const issue = arg('issue') || (arg('issue-file') ? fs.readFileSync(arg('issue-file'), 'utf8') : '');
if (!issueId || !issue) throw new Error('Usage: node scripts/ai-agent-run.js --issue-id=123 --issue="..."');

const BASE = process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1';
const KEY = process.env.OPENAI_API_KEY || 'ollama';
const MODEL = process.env.OPENAI_MODEL;
if (!MODEL) throw new Error('Missing OPENAI_MODEL');

const run = (c) => execSync(c, { stdio: 'pipe', encoding: 'utf8' }).trim();
const parseJSON = (s) => { const m = s.match(/\{[\s\S]*\}$/); if (!m) throw new Error('Invalid JSON'); return JSON.parse(m[0]); };
const chat = async (system, user) => {
  const root = BASE.replace(/\/$/, '');
  const endpoint = /\/v1$/.test(root) ? `${root}/chat/completions` : `${root}/v1/chat/completions`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  return parseJSON((await res.json()).choices?.[0]?.message?.content || '');
};

const readSafe = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const writeSafe = (f, content) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content, 'utf8'); };
const changedFiles = () => run('git diff --name-only').split('\n').filter(Boolean);

const planner = async () => chat(
  'You are Planner. Return only JSON: goal,steps,impacted_files,assumptions. Keep scope minimal.',
  `Issue:\n${issue}`
);

const implementer = async (plan, feedback = '') => {
  const files = (plan.impacted_files || []).slice(0, 30);
  const context = ['README.md', ...files].filter((f, i, a) => a.indexOf(f) === i)
    .map((f) => `### ${f}\n${readSafe(f).slice(0, 12000)}`).join('\n\n');
  return chat(
    'You are Implementer. Return only JSON contract with minimal changes. Use valid unified diffs. No unrelated edits.',
    `Plan:\n${JSON.stringify(plan)}\n\nFeedback:${feedback || 'none'}\n\nContext:\n${context}`
  );
};

const reviewer = async (changes) => chat(
  'You are Reviewer. Return only JSON: status,issues,suggestions. Mark unsafe for risky/broad/unrelated edits.',
  JSON.stringify(changes)
);

const applyDiff = (diff) => {
  const p = path.join(os.tmpdir(), `ai-agent-${Date.now()}.patch`);
  fs.writeFileSync(p, diff, 'utf8');
  run(`git apply --check "${p}"`);
  run(`git apply "${p}"`);
};

const applyChange = (c) => {
  if (!c.file || !c.action) throw new Error('Invalid change entry');
  if (c.diff) {
    try { applyDiff(c.diff); return; } catch (_) { if (!c.full_content) throw new Error(`Diff failed: ${c.file}`); }
  }
  if (c.action === 'delete') { if (fs.existsSync(c.file)) fs.unlinkSync(c.file); return; }
  if (typeof c.full_content !== 'string') throw new Error(`Missing full_content: ${c.file}`);
  if (c.action === 'modify' && !fs.existsSync(c.file)) throw new Error(`Cannot modify missing file: ${c.file}`);
  writeSafe(c.file, c.full_content);
};

const validate = () => {
  run('git diff --check');
  for (const f of changedFiles()) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    if (!txt.trim()) throw new Error(`Empty critical file: ${f}`);
    if (f.endsWith('.js')) run(`node --check "${f}"`);
  }
  if (process.env.AGENT_VALIDATE_CMD) run(process.env.AGENT_VALIDATE_CMD);
};

const main = async () => {
  const plan = await planner();
  let ch = await implementer(plan);
  let rv = await reviewer(ch);
  if (rv.status === 'needs_fix') {
    ch = await implementer(plan, JSON.stringify(rv));
    rv = await reviewer(ch);
  }
  if (rv.status !== 'ok') throw new Error(`Reviewer blocked run: ${rv.status}`);

  for (const c of (ch.changes || [])) applyChange(c);
  validate();

  const branch = `ai/issue-${issueId}`;
  run(`git checkout -B ${branch}`);
  run('git add -A');
  run(`git commit -m ${JSON.stringify(ch.commit_message || `feat: resolve issue ${issueId}`)}`);
  run(`git push -u origin ${branch}`);
  run(`gh pr create --fill --head ${branch}`);
  console.log(JSON.stringify({ status: 'ok', branch, commit_message: ch.commit_message, risk_level: ch.risk_level || 'unknown' }, null, 2));
};

main().catch((e) => { console.error(`ABORT: ${e.message}`); process.exit(1); });
