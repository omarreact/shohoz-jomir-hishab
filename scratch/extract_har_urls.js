const fs = require('fs');
const path = require('path');

const extractMapUrls = (harFile) => {
  const filePath = path.join(__dirname, '../lib/har', harFile);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const urls = new Set();
  
  data.log.entries.forEach(entry => {
    const url = entry.request.url;
    // Look for ArcGIS services
    if (url.includes('rajuk.gov.bd') && (url.includes('MapServer') || url.includes('FeatureServer') || url.includes('ImageServer'))) {
      // Clean up URL to just the service path
      let cleanUrl = url.split('?')[0];
      // Optional: further strip to just the layer name if we want
      urls.add(cleanUrl);
    }
  });
  
  return Array.from(urls).sort();
};

try {
  const rajukUrls = extractMapUrls('All_data_masterplan.rajuk.gov.bd.har');
  const localUrls = extractMapUrls('all_page_network_tab_details_localhost.har');

  console.log("=== RAJUK HAR Map Services ===");
  console.log(rajukUrls.join('\n'));
  
  console.log("\n=== LOCAL HAR Map Services ===");
  console.log(localUrls.join('\n'));
  
  // Find what's in Rajuk but not in Local
  const newUrls = rajukUrls.filter(u => !localUrls.includes(u));
  console.log("\n=== NEW SERVICES IN RAJUK ===");
  console.log(newUrls.join('\n'));
  
} catch (e) {
  console.error(e);
}
