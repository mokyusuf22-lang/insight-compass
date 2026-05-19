import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ekcjzwqjwmupolbxktrr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrY2p6d3Fqd211cG9sYnhrdHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjA3OTgsImV4cCI6MjA4MTY5Njc5OH0.XrcXzPa9fveiRL_2DyLk77_AZE_jmH4VoI1Cr5IPOa4';

const accounts = [
  { name: 'Alex Chen',      tag: 'alexchen',    password: 'BeMore@Alex1!'    },
  { name: 'Jordan Kim',     tag: 'jordankim',   password: 'BeMore@Jordan2!'  },
  { name: 'Riley Okafor',   tag: 'rileyokafor', password: 'BeMore@Riley3!'   },
  { name: 'Sam Patel',      tag: 'sampatel',    password: 'BeMore@Sam4!'     },
  { name: 'Morgan Torres',  tag: 'morgantorres',password: 'BeMore@Morgan5!'  },
  { name: 'Casey Williams', tag: 'caseywilliams',password:'BeMore@Casey6!'   },
  { name: 'Drew Hassan',    tag: 'drewhassan',  password: 'BeMore@Drew7!'    },
  { name: 'Quinn Nakamura', tag: 'quinnnakamura',password:'BeMore@Quinn8!'   },
  { name: 'Avery Singh',    tag: 'averysingh',  password: 'BeMore@Avery9!'   },
  { name: 'Taylor Adeyemi', tag: 'tayloradeyemi',password:'BeMore@Taylor10!' },
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
  const results = [];

  for (const acc of accounts) {
    const email = `mokyusuf22+${acc.tag}@gmail.com`;
    process.stdout.write(`Signing up ${acc.name} (${email})... `);
    try {
      const data = await signUp(email, acc.password, acc.name);
      if (data.id || data.user?.id) {
        console.log('OK');
        results.push({ name: acc.name, email, password: acc.password, status: 'created - needs email verification' });
      } else if (data.error || data.msg) {
        const msg = data.error || data.msg;
        console.log(`SKIP (${msg})`);
        results.push({ name: acc.name, email, password: acc.password, status: `skipped: ${msg}` });
      } else {
        console.log('OK (check status)');
        results.push({ name: acc.name, email, password: acc.password, status: 'created' });
      }
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      results.push({ name: acc.name, email, password: acc.password, status: `error: ${e.message}` });
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Write CSV
  const header = 'Name,Email,Password,Status';
  const rows = results.map(r =>
    `"${r.name}","${r.email}","${r.password}","${r.status}"`
  );
  const csv = [header, ...rows].join('\n');

  const outPath = join(__dirname, '..', 'dummy-accounts.csv');
  writeFileSync(outPath, csv, 'utf-8');
  console.log(`\nCredentials saved to: dummy-accounts.csv`);
  console.log('\n--- Account Summary ---');
  console.table(results.map(r => ({ Name: r.name, Email: r.email, Password: r.password })));
  console.log('\nNEXT STEP: Check mokyusuf22@gmail.com and click all 10 verification links.');
}

main();
