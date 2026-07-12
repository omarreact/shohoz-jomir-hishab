const testQuery = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=UPPER(mauza) LIKE '%PATIRA%' AND plot_no='2003'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/2&outFields=*`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
};
testQuery();
