const testMsQuery = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=plot_no='2003'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/2&outFields=*`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data.features[0].attributes);
  } catch(e) {
    console.error(e);
  }
};
testMsQuery();
