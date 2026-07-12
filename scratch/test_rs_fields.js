const testRsFields = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=1=1&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/0&outFields=*&resultRecordCount=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("RS Layer Sample:");
    if (data.features?.length > 0) {
      console.log(Object.keys(data.features[0].attributes));
    }
  } catch(e) {
    console.error(e);
  }
};
testRsFields();
