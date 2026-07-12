const fs = require('fs');

const harPath = 'C:\\Users\\Faruk Khan\\Downloads\\masterplan.rajuk.gov.bd.har';

try {
  const rawData = fs.readFileSync(harPath, 'utf8');
  const har = JSON.parse(rawData);
  
  const entries = har.log.entries;
  
  console.log("Looking for Token generation endpoints...");
  
  entries.forEach(entry => {
    const req = entry.request;
    if (req.url.toLowerCase().includes('token')) {
       console.log(`URL containing token: ${req.method} ${req.url.substring(0, 150)}`);
       if (req.postData && req.postData.text) {
         console.log(`  Payload: ${req.postData.text.substring(0, 100)}`);
       }
       if (entry.response && entry.response.content && entry.response.content.text && entry.response.content.text.includes('token')) {
         console.log(`  Response: ${entry.response.content.text.substring(0, 100)}`);
       }
    }
  });
  
  // Also, extract the actual token used in the query endpoints
  let sampleToken = null;
  entries.forEach(entry => {
    const req = entry.request;
    if (req.url.includes('query') && req.url.includes('token=')) {
        const url = new URL(req.url);
        sampleToken = url.searchParams.get('token');
    }
  });
  
  if (sampleToken) {
     console.log(`\nFound a sample token being used: ${sampleToken.substring(0, 30)}...`);
  } else {
     console.log("\nNo token found in query params.");
  }
} catch (err) {
  console.error("Error analyzing HAR file:", err.message);
}
