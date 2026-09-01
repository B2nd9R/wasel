const fs = require('fs');
const path = require('path');

async function testE2ESubmission() {
  console.log('=== Step 1: Check initial report count via API ===');
  const initialRes = await fetch('http://localhost:3001/api/reports');
  const initialData = await initialRes.json();
  const initialCount = initialData.total;
  console.log(`Initial reports count: ${initialCount}`);

  console.log('\n=== Step 2: Post a real citizen issue to /api/submit ===');
  // Small sample 1x1 base64 JPEG to simulate photo upload
  const sampleJpegBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  const submitPayload = {
    description: "Dangerous open pothole on King Fahd Road near exit 10 causing vehicles to swerve violently.",
    locationText: "King Fahd Road, Exit 10, Riyadh",
    latitude: 24.7136,
    longitude: 46.6753,
    photoBase64: sampleJpegBase64,
  };

  const submitRes = await fetch('http://localhost:3001/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submitPayload),
  });

  const submitResult = await submitRes.json();
  console.log('Submission API HTTP Status:', submitRes.status);
  console.log('Submission Response Success:', submitResult.success);
  console.log('Created Incident Details:');
  console.log(`- ID: ${submitResult.report?.id}`);
  console.log(`- Category: ${submitResult.report?.aiAnalysis?.category}`);
  console.log(`- Priority Score: ${submitResult.report?.aiAnalysis?.severityScore} / 100 (${submitResult.report?.aiAnalysis?.severityLevel})`);
  console.log(`- Status: ${submitResult.report?.status}`);
  console.log(`- Location: ${submitResult.report?.citizenInput?.locationText}`);
  console.log(`- AI Summary: "${submitResult.report?.aiAnalysis?.problemDescription}"`);

  console.log('\n=== Step 3: Verify DynamoDB polling on /api/reports ===');
  const updatedRes = await fetch('http://localhost:3001/api/reports');
  const updatedData = await updatedRes.json();
  console.log(`Updated reports count: ${updatedData.total} (was ${initialCount})`);

  const found = updatedData.reports.find(r => r.id === submitResult.report?.id);
  if (found) {
    console.log(`✅ SUCCESS: Newly created report ${found.id} is present in the live feed!`);
    console.log(`✅ First report in feed (highest priority): ${updatedData.reports[0].id} - ${updatedData.reports[0].aiAnalysis.category} (${updatedData.reports[0].aiAnalysis.severityScore}/100)`);
  } else {
    console.error('❌ Report not found in updated feed');
  }
}

testE2ESubmission();
