import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ekcjzwqjwmupolbxktrr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrY2p6d3Fqd211cG9sYnhrdHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjA3OTgsImV4cCI6MjA4MTY5Njc5OH0.XrcXzPa9fveiRL_2DyLk77_AZE_jmH4VoI1Cr5IPOa4';

const targets = [
  { name: 'Drew Hassan',     tag: 'drewhassan',     password: 'BeMore@Drew7!'    },
  { name: 'Quinn Nakamura',  tag: 'quinnnakamura',  password: 'BeMore@Quinn8!'   },
];

async function signUp(email, password, name) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, options: { data: { display_name: name } } }),
  });
  return res.json();
}

async function main() {
  const csvPath = join(__dirname, '..', 'dummy-accounts.csv');
  const csvText = readFileSync(csvPath, 'utf-8');
  const lines = csvText.trim().split('\n');
  const header = lines[0];
  const existingRows = lines.slice(1).map(l => {
    const m = l.match(/^"([^"]*)","([^"]*)","([^"]*)","([^"]*)"$/);
    return m ? { name: m[1], email: m[2], password: m[3], status: m[4] } : null;
  }).filter(Boolean);

  for (const acc of targets) {
    const email = `mokyusuf22+${acc.tag}@gmail.com`;
    process.stdout.write(`Signing up ${acc.name} (${email})... `);
    try {
      const data = await signUp(email, acc.password, acc.name);
      let status;
      if (data.id || data.user?.id) {
        status = 'created - needs email verification';
        console.log('OK');
      } else if (data.error || data.msg) {
        const msg = data.error || data.msg;
        status = `skipped: ${msg}`;
        console.log(`SKIP (${msg})`);
      } else {
        status = 'created';
        console.log('OK (check status)');
      }

      const row = existingRows.find(r => r.email === email);
      if (row) {
        row.status = status;
      } else {
        existingRows.push({ name: acc.name, email, password: acc.password, status });
      }
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      const row = existingRows.find(r => r.email === email);
      const status = `error: ${e.message}`;
      if (row) row.status = status;
      else existingRows.push({ name: acc.name, email, password: acc.password, status });
    }

    if (acc !== targets[targets.length - 1]) {
      process.stdout.write('Waiting 10s...\n');
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  const rows = existingRows.map(r => `"${r.name}","${r.email}","${r.password}","${r.status}"`);
  writeFileSync(csvPath, [header, ...rows].join('\n'), 'utf-8');
  console.log('\nCSV updated: dummy-accounts.csv');
}

main();
