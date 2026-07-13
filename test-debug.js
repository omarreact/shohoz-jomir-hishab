const url = "https://landbd.pincodeit.com/api/unified?include=msPlots&where=UPPER%28mauza%29+LIKE+%27%25PATIRA%25%27+AND+plot_no%3D%273922%27&limit=1";

fetch(url)
  .then(res => res.text().then(text => ({ status: res.status, headers: res.headers, text })))
  .then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    try {
      console.log("Body:", JSON.stringify(JSON.parse(res.text), null, 2));
    } catch (e) {
      console.log("Body text:", res.text);
    }
  })
  .catch(err => console.error("Fetch failed:", err));
