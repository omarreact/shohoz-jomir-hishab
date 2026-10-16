import {CmsRevisionConflict,currentCmsRevision,nextCmsRevision,versionDocumentId} from "./cms-versioning";
describe("CMS version safety",()=>{
 test("concurrent stale edits are rejected",()=>{
  expect(nextCmsRevision(5,5)).toBe(6);
  expect(()=>nextCmsRevision(5,4)).toThrow(CmsRevisionConflict);
  expect(()=>nextCmsRevision(5,6)).toThrow(CmsRevisionConflict);
 });
 test("legacy unversioned pages are revision zero",()=>{
  expect(currentCmsRevision(undefined)).toBe(0);
  expect(nextCmsRevision(undefined,0)).toBe(1);
 });
 test("ordered revision IDs",()=>{
  expect(versionDocumentId(0)).toBe("00000000");
  expect(versionDocumentId(12)).toBe("00000012");
  expect(()=>versionDocumentId(-1)).toThrow();
 });
});
