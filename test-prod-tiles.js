async function test() {
  const url = "https://landbd.pincodeit.com/api/tiles?service=Hosted/MS_Mauza_Tiles_Final&z=13&x=6153&y=3543";
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (!res.ok) {
      console.log("Response text:", await res.text());
    }
  } catch(e) {
    console.error(e);
  }
}
test();
