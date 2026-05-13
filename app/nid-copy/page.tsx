"use client";

import { useState, useEffect, useRef } from "react";
// @ts-ignore
import bwipjs from "bwip-js";

export default function SmartLogPage() {
  // সিগনেচার কন্ট্রোল করার স্টেট
  const [topRange, setTopRange] = useState<number>(165);
  const [paddingRange, setPaddingRange] = useState<number>(0);
  const [scaleRange, setScaleRange] = useState<number>(1);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // বারকোডের জন্য ক্যানভাস (Canvas)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hub3_code = `<pin>20082699645000014</pin><name>SOYKAT ALLE</name><DOB>02 Jan 1987</DOB><FP></FP><F>Right Index</F><TYPE></TYPE><V>2.0</V><ds>302d02150094b24c767848fa73cf4adb3fc75635d9c1148871a5950aa1d4204650651ec74c60b597eceea4b1c43c3a</ds>`;

  useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "pdf417",
          text: hub3_code,
          scale: 2,
          columns: 13,
          eclevel: 5,
          rowheight: 4, 
          paddingwidth: 0, 
          paddingheight: 0, 
          includetext: false,
        });
      } catch (e) {
        console.error("Barcode Error:", e);
      }
    }
  }, [hub3_code]);

  const handleRotate = () => setRotationAngle((prev) => prev + 90);
  const handlePrint = () => window.print();

  return (
    <div style={{ background: "white", color: "black", minHeight: "100vh", paddingBottom: "50px" }}>
      {/* গ্লোবাল ফন্ট এবং প্রিন্ট স্টাইল */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto+Slab:wght@100..900&display=swap');
        @media print {
          .hidden_when_print, .no-print { display: none !important; }
        }
      `}} />

      <div id="__next" style={{ width: "800px", margin: "0 auto", paddingTop: "20px" }}>
        <div className="flex" style={{ paddingLeft: "70px", paddingRight: "70px" }}>
          
          {/* FRONT SIDE */}
          <div id="front_side" className="id_side" style={{ display: "inline-block", position: "relative" }}>
            <div id="font_text" className="absolute">
              <div className="nameBan title font_family">নাম</div>
              <div className="nameBan main_text font_family">সৈকত আলি</div>
              
              <div className="nameEn title">Name</div>
              <div className="nameEn main_text">SOYKAT ALLE</div>
              
              <div className="fatherName title font_family">পিতা</div>
              <div className="fatherName main_text font_family">মোঃ হাকিম উদ্দিন</div>
              
              <div className="motherName title font_family">মাতা</div>
              <div className="motherName main_text font_family">হাবিবা খাতুন</div>
              
              <div className="dateOfBirth">
                <div className="date_title en_title">Date Of Birth</div>
                <div className="date_number en_title">02 Jan 1987</div>
              </div>
              
              <div className="nid">
                <div className="nid_title en_title">NID No.</div>
                <div className="nid_number en_title">734 396 7134</div>
              </div>
            </div>
            
            <img className="test_img" src="https://e-amarseba.online/smart/test.svg" alt="" />
            
            <div id="user_img">
              <img className="user_img" src="" alt="" />
              <img id="user_img" className="user_img" src="" alt="" />
              <div className="overflow_dob">02 Jan 1987</div>
            </div>
            
            <div id="sing_img_div" style={{ position: "absolute", top: `${topRange}px`, padding: `${paddingRange}px` }}>
              <img 
                id="sign_img" 
                className="sign_img" 
                src="" 
                alt="signature" 
                style={{ transform: `rotate(${rotationAngle}deg) scale(${scaleRange})`, transition: "all 0.2s ease" }}
              />
            </div>
            
            <div id="front_img">
              <img id="overflow_img" src="https://upload-image.click/upload/overflow.svg" alt="" />
              <img className="side_img" src="https://upload-image.click/upload/fronts.svg" alt="" />
            </div>
          </div>

          {/* BACK SIDE */}
          <div id="back_side" className="id_side" style={{ display: "inline-block", position: "relative" }}>
            <img id="user_img_two" className="user_img" src="" alt="" />
            <div id="back_img">
              <img className="side_img" src="https://upload-image.click/upload/back.svg" alt="" />
              <img className="overflow_back" src="https://upload-image.click/upload/overflow_back.svg" alt="" />
              
              <div className="address" style={{ fontWeight: "normal", fontSize: "10px", lineHeight: "12px", position: "absolute", width: "80%" }}>
                ঠিকানা: বাসা/হোল্ডিং: বাসা/হোল্ডিং: খাঁ বাড়ি, গ্রাম/রাস্তা: পাতিরা, পাতিরা, ডাকঘর: তলনা - ১২২৯, খিলক্ষেত, ঢাকা উত্তর সিটি কর্পোরেশন, ঢাকা
              </div>
              
              <div className="back_text_one">
                <span className="fist_line_one back_line_one" style={{ top: "2.5px" }}>
                  Blood Group: <span className="result_one bloodGroup"></span>
                </span>
                <span className="second_line_one back_line_one">
                  Place of Birth: <span className="result_one place_of_birth">DHAKA</span>
                </span>
                <span className="third_line_one back_line_one">
                  Issue Date: <span className="result_one date_of_issue">26 May 2024</span>
                </span>
              </div>
              
              <div className="back_text">
                <div className="first_line back_line">
                  {['I', 'B', 'G', 'D', '7', '3', '4', ' ', '3', '9', '6', ' ', '7', '1', '3', '4'].map((char, i) => (
                    <div key={`f-${i}`} className="f_line_icon for_last">{char}</div>
                  ))}
                </div>
                <div className="second_line back_line">
                  {['8', '7', '0', '1', '0', '2', 'M', 'A', 'L', 'E', '6', '9', '8', '5', '1', '5', '8', 'B', 'G', 'D', '2'].map((char, i) => (
                    <div key={`s-${i}`} className="f_line_icon for_last">{char}</div>
                  ))}
                </div>
                <div className="third_line back_line">
                  {['A', 'L', 'L', 'E', 'S', 'O', 'Y', 'K', 'A', 'T'].map((char, i) => (
                    <div key={`t-${i}`} className="f_line_icon for_last">{char}</div>
                  ))}
                </div>
              </div>
              
              <div style={{ position: "absolute", top: "13px", left: "20px", transform: "rotate(180deg)", width: "290px", height: "38px" }}>
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="hidden_when_print container mt-5 p-4 border rounded bg-light shadow-sm" style={{ maxWidth: "800px" }}>
        <h5 className="fw-bold mb-4 text-primary border-bottom pb-2">সিগনেচার কন্ট্রোল প্যানেল</h5>
        
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-bold">সিগনেচার উপর নিচঃ <span className="text-danger">{topRange}px</span></label>
            <input type="range" className="form-range" min="100" max="190" value={topRange} onChange={(e) => setTopRange(Number(e.target.value))} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">প্যাডিংঃ <span className="text-danger">{paddingRange}px</span></label>
            <input type="range" className="form-range" min="0" max="25" value={paddingRange} onChange={(e) => setPaddingRange(Number(e.target.value))} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">জুম (Scale): <span className="text-danger">{scaleRange}</span></label>
            <input type="range" className="form-range" min="0.5" max="2" step="0.1" value={scaleRange} onChange={(e) => setScaleRange(Number(e.target.value))} />
          </div>
        </div>
        
        <div className="d-flex gap-3">
          <button className="btn btn-warning fw-bold px-4 rounded-pill" onClick={handleRotate}>
            ↺ সিগনেচার ঘুরান
          </button>
          <button className="btn btn-primary fw-bold px-5 rounded-pill" onClick={handlePrint}>
            🖨️ প্রিন্ট করুন
          </button>
        </div>
      </div>
    </div>
  );
}