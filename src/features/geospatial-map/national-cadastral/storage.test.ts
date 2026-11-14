import { parseSingleByteRange } from "./storage";

describe("national cadastral byte-range serving",()=>{
  it("parses bounded, open-ended and suffix ranges",()=>{
    expect(parseSingleByteRange("bytes=0-99",1000)).toEqual({ok:true,start:0,end:99,length:100});
    expect(parseSingleByteRange("bytes=900-",1000)).toEqual({ok:true,start:900,end:999,length:100});
    expect(parseSingleByteRange("bytes=-50",1000)).toEqual({ok:true,start:950,end:999,length:50});
  });
  it("rejects multi-range, reversed and out-of-bounds requests",()=>{
    expect(parseSingleByteRange("bytes=0-1,3-4",1000)).toEqual({ok:false});
    expect(parseSingleByteRange("bytes=10-2",1000)).toEqual({ok:false});
    expect(parseSingleByteRange("bytes=1000-",1000)).toEqual({ok:false});
  });
});
