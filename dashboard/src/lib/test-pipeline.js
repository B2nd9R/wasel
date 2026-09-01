const fs = require('fs');
const path = require('path');

// Load .env.local
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
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const region = process.env.AWS_REGION || 'us-west-2';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
};

const ssm = new SSMClient({ region, credentials });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region, credentials }));
const bedrock = new BedrockRuntimeClient({ region, credentials });

async function testPipeline() {
  console.log('--- Step 1: Query SSM for table name ---');
  const param = await ssm.send(new GetParameterCommand({ Name: '/app/workshop/citypulse/reports-table' }));
  const tableName = param.Parameter.Value;
  console.log('✅ DynamoDB Table:', tableName);

  console.log('\n--- Step 2: Test Bedrock Claude text/vision ---');
  try {
    const prompt = 'You are a road safety inspector. Respond in JSON: {"confirmed": true, "severity": "critical", "description": "Large road defect detected on King Fahd Rd.", "description_ar": "تم رصد تلف كبير في الطريق"}';
    const bedrockRes = await bedrock.send(new InvokeModelCommand({
      modelId: 'us.anthropic.claude-sonnet-4-6',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 300,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    }));
    const decoded = JSON.parse(new TextDecoder().decode(bedrockRes.body));
    console.log('✅ Bedrock Output:', decoded.content[0].text);
  } catch (err) {
    console.log('⚠️ Bedrock call error (will use fallback vision parser):', err.message);
  }

  console.log('\n--- Step 3: Check DynamoDB count before ---');
  const before = await ddb.send(new ScanCommand({ TableName: tableName }));
  console.log('Initial DynamoDB items count:', before.Items ? before.Items.length : 0);

  console.log('\n--- Step 4: Write test report to DynamoDB ---');
  const testId = `R-TEST-${Date.now().toString().slice(-4)}`;
  const testItem = {
    report_id: testId,
    resident_id: 'resident-test',
    category: 'pothole',
    source: 'manual',
    latitude: '24.713600',
    longitude: '46.675300',
    address: 'King Fahd Road, Al-Olaya, Riyadh',
    severity: 'critical',
    priority_score: 87,
    description: 'Deep pothole in active fast lane on King Fahd Road',
    description_ar: 'حفرة عميقة في المسار السريع على طريق الملك فهد',
    status: 'NEW',
    created_at: new Date().toISOString(),
    reported_date: new Date().toISOString().slice(0, 10),
    sla_days: '1',
  };
  await ddb.send(new PutCommand({ TableName: tableName, Item: testItem }));
  console.log(`✅ Successfully written report ${testId} to DynamoDB`);

  console.log('\n--- Step 5: Check DynamoDB count after ---');
  const after = await ddb.send(new ScanCommand({ TableName: tableName }));
  console.log('Final DynamoDB items count:', after.Items ? after.Items.length : 0);
  const found = after.Items.find(i => i.report_id === testId);
  console.log('✅ Found newly created item:', found ? found.report_id : 'NOT FOUND');
}

testPipeline();
