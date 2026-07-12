const fs = require('fs');
const path = require('path');

const harPath = 'C:\\Users\\Faruk Khan\\Downloads\\masterplan.rajuk.gov.bd.har';

try {
  console.log(`Reading HAR file: ${harPath}`);
  const rawData = fs.readFileSync(harPath, 'utf8');
  const har = JSON.parse(rawData);
  
  const entries = har.log.entries;
  console.log(`Total requests recorded: ${entries.length}\n`);

  const apiEndpoints = {};

  entries.forEach(entry => {
    const req = entry.request;
    const res = entry.response;
    const url = new URL(req.url);

    // Only look at rajuk or GIS related endpoints
    if (url.hostname.includes('rajuk') || url.pathname.includes('api') || url.pathname.includes('arcgis')) {
      const endpointKey = `${req.method} ${url.origin}${url.pathname}`;
      
      if (!apiEndpoints[endpointKey]) {
        apiEndpoints[endpointKey] = {
          url: req.url,
          method: req.method,
          queryParams: req.queryString.map(q => q.name),
          postData: req.postData ? req.postData.text : null,
          responseStatus: res.status,
          responseMimeType: res.content.mimeType,
          responseSize: res.content.size,
          sampleResponseText: res.content.text ? res.content.text.substring(0, 500) + '...' : null
        };
      }
    }
  });

  console.log("=== RAJUK / GIS API ENDPOINTS FOUND ===\n");
  for (const [key, data] of Object.entries(apiEndpoints)) {
    // Filter out obvious static assets
    if (!data.url.match(/\.(png|jpg|jpeg|gif|css|js|woff2?|svg|ico)$/i) && !data.responseMimeType.includes('image')) {
      console.log(`Endpoint: ${key}`);
      if (data.queryParams.length > 0) console.log(`  Query Params: ${data.queryParams.join(', ')}`);
      if (data.postData && data.postData.length < 500) console.log(`  Payload: ${data.postData}`);
      console.log(`  Response Type: ${data.responseMimeType} (${Math.round(data.responseSize / 1024)} KB)`);
      
      // If it's JSON, try to parse and show keys
      if (data.responseMimeType.includes('json') && data.sampleResponseText) {
         try {
           const parsed = JSON.parse(data.sampleResponseText.replace('...', ''));
           const keys = Object.keys(parsed);
           console.log(`  JSON Keys (Root): ${keys.join(', ')}`);
           
           // If there is a 'features' array (common in GIS), show what attributes exist
           if (parsed.features && parsed.features.length > 0) {
              console.log(`  Feature Attributes: ${Object.keys(parsed.features[0].attributes || {}).join(', ')}`);
           }
         } catch(e) {
           // Ignore parse errors on truncated text
         }
      }
      console.log('--------------------------------------------------\n');
    }
  }

} catch (err) {
  console.error("Error analyzing HAR file:", err.message);
}
