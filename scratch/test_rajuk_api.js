const https = require('https');

// RAJUK ArcGIS REST API Endpoint for DAP Database FeatureServer 6
// We will request JSON format (f=json) to avoid parsing Protobuf (PBF) manually for now.
const url = 'https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/6/query?f=json&where=1%3D1&returnGeometry=false&outFields=*&resultRecordCount=5';

console.log(`Fetching from: ${url}`);

https.get(url, {
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'https://masterplan.rajuk.gov.bd',
    'Referer': 'https://masterplan.rajuk.gov.bd/'
  }
}, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error("API Error:", json.error);
      } else {
        console.log("\nSuccess! Here is a sample of the data:");
        console.log("Fields Available:");
        console.log(json.fields?.map(f => `${f.name} (${f.alias})`).join(', '));
        
        console.log("\nSample Features:");
        if (json.features && json.features.length > 0) {
          json.features.forEach((feature, index) => {
             console.log(`\nRecord ${index + 1}:`);
             console.log(feature.attributes);
          });
        } else {
          console.log("No features returned.");
        }
      }
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      console.log("Raw response snippet:", data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.error("Request failed:", err.message);
});
