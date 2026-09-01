async function testCss() {
  try {
    const htmlRes = await fetch('http://localhost:3001/dashboard');
    const html = await htmlRes.text();
    const matches = html.match(/href="(\/_next\/static\/css\/[^"]+)"/);
    if (matches && matches[1]) {
      const cssPath = matches[1];
      console.log('CSS URL:', cssPath);
      const cssRes = await fetch('http://localhost:3001' + cssPath);
      const css = await cssRes.text();
      console.log('✅ Compiled CSS size:', css.length, 'bytes');
      console.log('✅ Has #f7f6ff background:', css.includes('#f7f6ff'));
      console.log('✅ Has #4d4b66 primary brand:', css.includes('#4d4b66'));
      console.log('✅ Has flex utilities:', css.includes('.flex'));
      console.log('✅ Has rounded utilities:', css.includes('.rounded'));
      console.log('✅ Has font-sans utility:', css.includes('.font-sans'));
    } else {
      console.log('No external CSS link found in HTML (might be inlined in dev mode)');
      console.log('HTML contains style tags:', html.includes('<style'));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testCss();
