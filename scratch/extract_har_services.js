const fs = require('fs');
const path = require('path');

const extractServices = (harFile) => {
  const filePath = path.join(__dirname, '../lib/har', harFile);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const services = new Set();
  
  data.log.entries.forEach(entry => {
    const url = entry.request.url;
    if (url.includes('rajuk.gov.bd') && (url.includes('MapServer') || url.includes('FeatureServer') || url.includes('ImageServer'))) {
      // Extract everything up to MapServer or FeatureServer + optionally the layer id
      const match = url.match(/(.+?(?:MapServer|FeatureServer|ImageServer)(?:\/\d+)?)/);
      if (match) {
        services.add(match[1]);
      }
    }
  });
  
  return Array.from(services).sort();
};

try {
  const rajukUrls = extractServices('All_data_masterplan.rajuk.gov.bd.har');
  const localUrls = extractServices('all_page_network_tab_details_localhost.har');

  console.log("=== UNIQUE SERVICES IN RAJUK HAR ===");
  console.log(rajukUrls.join('\n'));
  
  console.log("\n=== UNIQUE SERVICES IN LOCAL HAR ===");
  console.log(localUrls.join('\n'));
  
  const newUrls = rajukUrls.filter(u => !localUrls.includes(u));
  console.log("\n=== NEW SERVICES FOUND ===");
  console.log(newUrls.join('\n'));
  
} catch (e) {
  console.error(e);
}
