const testFields = async () => {
  const url = `https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/2?f=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Fields:", data.fields?.map(f => f.name));
  } catch(e) {
    console.error(e);
  }
};
testFields();
