const fetchServices = async () => {
  const url = `https://masterplan.rajuk.gov.bd/server/rest/services?f=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Root Services:", data.services);
    
    // Also check the "Hosted" folder
    const hostedUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/Hosted?f=json`;
    const hostedRes = await fetch(hostedUrl);
    const hostedData = await hostedRes.json();
    console.log("Hosted Services:", hostedData.services.map(s => s.name));
    
    // Also check "rajuk_db" folder
    const rajukDbUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db?f=json`;
    const rajukDbRes = await fetch(rajukDbUrl);
    const rajukDbData = await rajukDbRes.json();
    console.log("Rajuk DB Services:", rajukDbData.services.map(s => s.name));
    
  } catch(e) {
    console.error(e);
  }
};
fetchServices();
