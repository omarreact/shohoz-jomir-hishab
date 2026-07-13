async function test() {
  const url = "https://masterplan.rajuk.gov.bd/server/rest/services/Hosted/RS_Mauza_Tiles_Final/MapServer?f=json";
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(json).substring(0, 300));
  } catch(e) {
    console.error(e);
  }
}
test();
