const testAllFields = async () => {
  for (let i = 0; i <= 3; i++) {
    const url = `https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/${i}?f=json`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`Layer ${i} fields:`, data.fields?.map(f => f.name));
    } catch(e) {
      console.error(e);
    }
  }
};
testAllFields();
