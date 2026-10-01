"use client";

export const LANDBD_TAGLINES = [
  "ভূমি সেবা হাতের মুঠোয়।",
  "সঠিক সময়ে ভূমি কর দিন।",
  "নিরাপদ হোক আপনার সম্পত্তি।",
] as const;

export const LANDBD_TAGLINE = LANDBD_TAGLINES.join(" ");

type Props = {
  className?: string;
};

/**
 * Print-safe vector ribbon based on the LandBD footer artwork supplied by the
 * product owner. SVG keeps the Bangla tagline crisp at any A4 print scale and
 * avoids raster resampling in browser print/PDF output.
 */
export default function LandBdPrintRibbon({ className = "" }: Props) {
  return (
    <div
      className={`landbd-print-ribbon ${className}`}
      role="img"
      aria-label={LANDBD_TAGLINE}
      title={LANDBD_TAGLINE}
    >
      <svg
        viewBox="0 0 1024 59"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
      >
        <polygon points="0,0 383,0 345,59 0,59" fill="#00369A" />
        <polygon points="383,0 701,0 663,59 345,59" fill="#C0183A" />
        <polygon points="701,0 1024,0 1024,59 663,59" fill="#046B3A" />

        <text
          x="174"
          y="39"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Kalpurush, Noto Serif Bengali, Nirmala UI, sans-serif"
          fontSize="27"
          fontWeight="500"
        >
          {LANDBD_TAGLINES[0]}
        </text>
        <text
          x="521"
          y="39"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Kalpurush, Noto Serif Bengali, Nirmala UI, sans-serif"
          fontSize="25"
          fontWeight="500"
        >
          {LANDBD_TAGLINES[1]}
        </text>
        <text
          x="847"
          y="39"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Kalpurush, Noto Serif Bengali, Nirmala UI, sans-serif"
          fontSize="24"
          fontWeight="500"
        >
          {LANDBD_TAGLINES[2]}
        </text>
      </svg>

      <style jsx>{`
        .landbd-print-ribbon {
          width: 100%;
          overflow: hidden;
          line-height: 0;
          background: #fff;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .landbd-print-ribbon svg {
          display: block;
          width: 100%;
          height: auto;
          min-height: 24px;
        }

        @media print {
          .landbd-print-ribbon svg {
            height: 7.5mm;
            min-height: 7.5mm;
          }
        }
      `}</style>
    </div>
  );
}
