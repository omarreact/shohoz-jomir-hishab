fetch("http://localhost:3000/api/unified", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    include: "landuse,flood,transport",
    where: "p_guid='M-{A3C645BD-7123-40DA-96D1-5BE71DFC9360}'" // one of the guids
  })
})
  .then(res => res.json())
  .then(json => {
    console.log(JSON.stringify(json, null, 2));
  })
  .catch(err => console.error("Fetch error:", err));
