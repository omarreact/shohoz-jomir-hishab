/** Deterministic fixed-window transition for Firestore fallback counters. */
export type RateWindow={count:number;resetAt:number};
export function nextRateWindow(current:RateWindow|null,nowMs:number,max:number,windowSeconds:number){
 if(!Number.isFinite(nowMs)||!Number.isSafeInteger(max)||max<1||windowSeconds<1)
  throw new RangeError("Invalid rate limit");
 const valid=!!current&&Number.isSafeInteger(current.count)&&current.count>0
   &&Number.isFinite(current.resetAt)&&current.resetAt>nowMs;
 const next:RateWindow=valid
  ?{count:Math.min(current.count+1,max+1),resetAt:current.resetAt}
  :{count:1,resetAt:nowMs+windowSeconds*1000};
 return {...next,allowed:next.count<=max};
}
