import { getServiceCatalog,servicePrice } from "@/src/lib/services-registry";
import { getCmsPage } from "@/src/lib/cms-store";
export default async function LandBDStructuredData(){
 const [services,home]=await Promise.all([getServiceCatalog(),getCmsPage("homepage")]);
 const base="https://landbd.pincodeit.com";
 const data={
  "@context":"https://schema.org",
  "@graph":[
   {"@type":"Organization","@id":base+"/#organization",name:"LandBD",url:base,logo:base+"/brand/landbd-symbol.svg"},
   {"@type":"WebApplication","@id":base+"/#app",name:"LandBD",description:home.seoDescription||home.description,url:base,
    inLanguage:"bn-BD",applicationCategory:"BusinessApplication",operatingSystem:"Web"},
   ...services.filter(s=>s.enabled).map(s=>({
     "@type":"Service",name:s.name,url:base+s.path,areaServed:{"@type":"Country",name:"Bangladesh"},
     provider:{"@id":base+"/#organization"},
     offers:{"@type":"Offer",priceCurrency:"BDT",price:servicePrice(s).toFixed(2),availability:"https://schema.org/InStock"}
   }))
  ]
 };
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/>;
}