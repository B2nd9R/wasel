const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || 'us-west-2';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
};

const ssm = new SSMClient({ region, credentials });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region, credentials }));

async function verifyIntegration() {
  const param = await ssm.send(new GetParameterCommand({ Name: '/app/workshop/citypulse/reports-table' }));
  const tableName = param.Parameter.Value;
  console.log('✅ Connected to Table:', tableName);

  const res = await ddb.send(new ScanCommand({ TableName: tableName }));
  console.log(`✅ Total Live Reports in DynamoDB: ${res.Items ? res.Items.length : 0}`);
  
  // Display latest 3 reports
  const sorted = (res.Items || []).sort((a, b) => new Date(b.created_at || b.reported_date || 0) - new Date(a.created_at || a.reported_date || 0));
  console.log('Latest 3 reports in DynamoDB:');
  sorted.slice(0, 3).forEach(r => {
    console.log(`- ID: ${r.report_id} | Category: ${r.category} | Severity: ${r.severity} | Status: ${r.status} | Address: ${r.address || r.locationText}`);
  });
}

verifyIntegration();
