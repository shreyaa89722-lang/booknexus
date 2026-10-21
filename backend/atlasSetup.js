/**
 * atlasSetup.js
 * Uses the MongoDB Atlas Admin API to:
 * 1. Find the project & cluster
 * 2. Resume the cluster if paused
 * 3. Whitelist 0.0.0.0/0 (allow all IPs permanently)
 * 4. Print the correct connection string
 *
 * Usage: node atlasSetup.js <PUBLIC_KEY> <PRIVATE_KEY>
 * Get keys from: Atlas → top-right avatar → Organization Settings → API Keys → Create API Key
 */

const https = require('https');

const PUBLIC_KEY  = process.argv[2];
const PRIVATE_KEY = process.argv[3];

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.log('\n❌  Missing API keys!');
  console.log('\nTo get Atlas API keys (takes 60 seconds):');
  console.log('  1. Go to https://cloud.mongodb.com');
  console.log('  2. Click your avatar (top-right) → Organization Settings');
  console.log('  3. Click "Access Manager" → "API Keys" tab');
  console.log('  4. Click "Create API Key"');
  console.log('  5. Give it "Organization Owner" role');
  console.log('  6. Copy the Public Key & Private Key shown');
  console.log('\nThen run:');
  console.log('  node atlasSetup.js <PUBLIC_KEY> <PRIVATE_KEY>\n');
  process.exit(1);
}

function atlasRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${PUBLIC_KEY}:${PRIVATE_KEY}`).toString('base64');
    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'cloud.mongodb.com',
      port: 443,
      path: `/api/atlas/v1.0${path}`,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔑 Authenticating with MongoDB Atlas API...\n');

  // 1. Get all projects
  const orgs = await atlasRequest('GET', '/orgs');
  if (orgs.status !== 200) {
    console.error('❌ Auth failed:', JSON.stringify(orgs.body));
    process.exit(1);
  }
  console.log(`✅ Authenticated. Found ${orgs.body.results.length} organization(s).`);

  let projectId = null;
  let projectName = null;

  for (const org of orgs.body.results) {
    const projects = await atlasRequest('GET', `/orgs/${org.id}/groups`);
    if (projects.status === 200) {
      for (const proj of projects.body.results) {
        console.log(`  📁 Project: ${proj.name} (${proj.id})`);
        if (proj.name.toLowerCase().includes('booknexus') || proj.name.toLowerCase().includes('book')) {
          projectId = proj.id;
          projectName = proj.name;
        }
      }
    }
  }

  if (!projectId) {
    // fallback: use first project
    const allProjects = await atlasRequest('GET', '/groups');
    if (allProjects.body.results && allProjects.body.results.length > 0) {
      projectId = allProjects.body.results[0].id;
      projectName = allProjects.body.results[0].name;
    }
  }

  if (!projectId) {
    console.error('❌ Could not find any project.');
    process.exit(1);
  }
  console.log(`\n✅ Using project: ${projectName} (${projectId})\n`);

  // 2. Whitelist 0.0.0.0/0
  console.log('🔒 Setting up IP Access List (0.0.0.0/0 = allow all)...');
  const ipRes = await atlasRequest('POST', `/groups/${projectId}/accessList`, [
    { cidrBlock: '0.0.0.0/0', comment: 'Allow all - development' }
  ]);
  if (ipRes.status === 200 || ipRes.status === 201) {
    console.log('✅ IP whitelist 0.0.0.0/0 added successfully!');
  } else if (ipRes.status === 409) {
    console.log('✅ IP whitelist 0.0.0.0/0 already exists.');
  } else {
    console.warn('⚠  IP whitelist response:', ipRes.status, JSON.stringify(ipRes.body));
  }

  // 3. Get clusters
  console.log('\n🔍 Fetching clusters...');
  const clusters = await atlasRequest('GET', `/groups/${projectId}/clusters`);
  if (clusters.status !== 200 || !clusters.body.results.length) {
    console.error('❌ No clusters found:', JSON.stringify(clusters.body));
    process.exit(1);
  }

  for (const cluster of clusters.body.results) {
    console.log(`\n📦 Cluster: ${cluster.name}`);
    console.log(`   State: ${cluster.stateName}`);
    console.log(`   Connection: ${cluster.connectionStrings?.standardSrv || 'N/A'}`);

    // 4. Resume if paused
    if (cluster.stateName === 'IDLE' || cluster.stateName === 'PAUSED') {
      console.log('  ⏸  Cluster is paused. Resuming...');
      const resume = await atlasRequest('PATCH', `/groups/${projectId}/clusters/${cluster.name}`, {
        paused: false
      });
      if (resume.status === 200 || resume.status === 202) {
        console.log('  ▶  Resume request sent! Cluster will be active in ~2 minutes.');
      } else {
        console.warn('  ⚠  Resume response:', resume.status, JSON.stringify(resume.body));
      }
    }

    // 5. Build connection string
    const srvHost = cluster.connectionStrings?.standardSrv;
    if (srvHost) {
      const connStr = `${srvHost}/bookhive?retryWrites=true&w=majority`;
      console.log(`\n✅ CONNECTION STRING (add your password):`);
      console.log(`   ${connStr}`);
      console.log(`\n   Replace the URI in your .env with:`);
      console.log(`   MONGO_URI=${srvHost.replace('mongodb+srv://', 'mongodb+srv://booknexus:Nexus-20_26%3B@')}/bookhive?retryWrites=true&w=majority`);
    }
  }

  console.log('\n✅ Atlas setup complete!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
