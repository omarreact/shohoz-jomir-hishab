const test9 = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=plot_no='2003'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/9&outFields=*`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("FS9:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
};
test9();
