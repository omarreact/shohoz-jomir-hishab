/** Pure CMS optimistic concurrency and revision key helpers. */
export class CmsRevisionConflict extends Error {
 constructor(){super("CMS content changed in another session. Reload before publishing.");this.name="CmsRevisionConflict";}
}
export function currentCmsRevision(value:unknown):number{
 return typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:0;
}
export function nextCmsRevision(current:unknown,expected:number):number{
 const n=currentCmsRevision(current);
 if(!Number.isSafeInteger(expected)||expected<0||expected!==n)throw new CmsRevisionConflict();
 if(n>=99999999)throw new Error("CMS revision limit reached");
 return n+1;
}
export function versionDocumentId(revision:number):string{
 if(!Number.isSafeInteger(revision)||revision<0||revision>99999999)throw new Error("Invalid CMS revision");
 return String(revision).padStart(8,"0");
}
