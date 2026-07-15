const fs = require('fs');
const path = require('path');

const harPath = 'C:\\Users\\Faruk Khan\\Downloads\\landbd.pincodeit.com.har';

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

    // Log all errors (status >= 400) or GIS endpoints
    if (res.status >= 400 || url.hostname.includes('rajuk') || url.pathname.includes('api') || url.pathname.includes('arcgis')) {
      const endpointKey = `${req.method} ${url.origin}${url.pathname}`;
      
      if (!apiEndpoints[endpointKey] || res.status >= 400) {
        // use status code in key to differentiate failed ones
        const uniqueKey = res.status >= 400 ? `${endpointKey} (ERROR ${res.status})` : endpointKey;
        apiEndpoints[uniqueKey] = {
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

  console.log("=== API ENDPOINTS & ERRORS FOUND ===\n");
  for (const [key, data] of Object.entries(apiEndpoints)) {
    // Just dump everything we recorded
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
