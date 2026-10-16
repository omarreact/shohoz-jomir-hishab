import {nextRateWindow} from "./rate-window";
describe("Durable rate windows",()=>{
 test("permits until limit and resets on expiration",()=>{
  const a=nextRateWindow(null,1000,2,60);
  expect(a.allowed).toBe(true);
  const b=nextRateWindow(a,1100,2,60);
  expect(b).toMatchObject({count:2,allowed:true});
  const c=nextRateWindow(b,1200,2,60);
  expect(c.allowed).toBe(false);
  expect(nextRateWindow(c,61000,2,60)).toMatchObject({count:1,allowed:true});
 });
 test("clamps abuse counts",()=>{
  expect(nextRateWindow({count:999,resetAt:60000},0,3,60).count).toBe(4);
 });
 test("rejects malformed arguments",()=>{
  expect(()=>nextRateWindow(null,0,0,60)).toThrow();
 });
});
