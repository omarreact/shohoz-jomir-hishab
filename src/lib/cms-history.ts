import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "@/src/modules/database/firebaseAdmin";
import { defaultCmsPage,type CmsSlug,type CmsPage } from "@/src/lib/cms-store";
import { nextCmsRevision,CmsRevisionConflict,versionDocumentId } from "@/src/lib/cms-versioning";
import type { ServerUser } from "@/src/modules/auth/serverAuth";

export type CmsEditable=Pick<CmsPage,"title"|"description"|"seoTitle"|"seoDescription"|"published"|"sections">;
export type CmsVersion=CmsEditable&{
 slug:CmsSlug;revision:number;action:"save"|"restore"|"baseline";
 createdAt:string;createdBy:string;restoredFromRevision:number|null;
};
function effectivePage(slug:CmsSlug,raw:Record<string,unknown>|undefined):CmsEditable{
 const fallback=defaultCmsPage(slug);
 const fields=raw??{};
 return {
 title:typeof fields.title==="string"?fields.title:fallback.title,
 description:typeof fields.description==="string"?fields.description:fallback.description,
 seoTitle:typeof fields.seoTitle==="string"?fields.seoTitle:fallback.seoTitle,
 seoDescription:typeof fields.seoDescription==="string"?fields.seoDescription:fallback.seoDescription,
 published:typeof fields.published==="boolean"?fields.published:fallback.published,
 sections:Array.isArray(fields.sections)?fields.sections as CmsEditable["sections"]:fallback.sections
 };
}
export async function cmsVersions(slug:CmsSlug):Promise<CmsVersion[]>{
 const snap=await db.collection("landbdCmsVersions").doc(slug).collection("entries")
   .orderBy("revision","desc").limit(40).get();
 return snap.docs.map(doc=>doc.data() as CmsVersion);
}
export async function writeCmsVersion(params:{
 slug:CmsSlug;actor:ServerUser;expectedRevision:number;
 action:"save"|"restore";content?:CmsEditable;sourceRevision?:number
}):Promise<number>{
 const {slug,actor,expectedRevision,action}=params;
 const ref=db.collection("landbdCmsPages").doc(slug);
 const history=db.collection("landbdCmsVersions").doc(slug).collection("entries");
 const audit=db.collection("adminAuditLog").doc();
 return db.runTransaction(async tx=>{
  const current=await tx.get(ref);
  const raw=current.data();
  const revision=nextCmsRevision(raw?.revision,expectedRevision);
  const restored=params.sourceRevision===undefined?null:params.sourceRevision;
  const versionRef=restored===null?null:history.doc(versionDocumentId(restored));
  // All reads must happen before any writes in Firestore transactions.
  const versionSnap=versionRef?await tx.get(versionRef):null;
  if(action==="restore"&&(!versionSnap?.exists||restored===null))
   throw new Error("CMS revision not found");
  if(action==="save"&&!params.content)throw new Error("CMS content missing");
  const content=action==="restore"?
   effectivePage(slug,versionSnap?.data()):params.content!;
  const timestamp=new Date().toISOString();
  if(revision===1){
   const base=effectivePage(slug,raw);
   tx.create(history.doc(versionDocumentId(0)),{
    ...base,slug,revision:0,action:"baseline",createdAt:typeof raw?.updatedAt==="string"?raw.updatedAt:timestamp,
    createdBy:typeof raw?.updatedBy==="string"?raw.updatedBy:"system",restoredFromRevision:null
   } satisfies CmsVersion);
  }
  const record:CmsVersion={...content,slug,revision,action,
   createdAt:timestamp,createdBy:actor.id,restoredFromRevision:restored};
  tx.create(history.doc(versionDocumentId(revision)),record);
  tx.set(ref,{...content,revision,updatedAt:timestamp,updatedBy:actor.id},{merge:true});
  tx.create(audit,{actorId:actor.id,actorEmail:actor.email||null,actorRole:actor.role,
   action:action==="save"?"cms.publish":"cms.restore",targetType:"cmsPage",targetId:slug,
   requestId:null,metadata:{revision,restoredFromRevision:restored},createdAt:Timestamp.now()});
  return revision;
 });
}
export {CmsRevisionConflict};
