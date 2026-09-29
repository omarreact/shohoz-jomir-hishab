import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ওয়ারিশ সনদপত্র | LandBD",
  description: "ঢাকা উত্তর সিটি কর্পোরেশন ওয়ারিশ সনদপত্র।",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WarishPage() {
  return (
    <main className="page-a4">
      <img className="watermark" src="/warish-assets/dncc.png" alt="" aria-hidden="true" />

      <div className="content">
        <header className="header">
          <div className="logo-wrap">
            <img
              className="header-logo"
              src="/warish-assets/dncc.png"
              alt="ঢাকা উত্তর সিটি কর্পোরেশন লোগো"
            />
          </div>
          <div className="header-copy">
            <div className="header-bn">ঢাকা উত্তর সিটি কর্পোরেশন</div>
            <div className="header-en">Dhaka North City Corporation</div>
            <div className="header-address">অঞ্চল-০৯ / Zone-09, ঢাকা-১২১২ / Dhaka-1212.</div>
            <div className="header-website">Website: www.dncc.gov.bd</div>
          </div>
        </header>

        <div className="divider" />

        <div className="ref-date">
          <div>সূত্র: ৪৬.১০.০০০০.১৮১.৯৯.০০১.২৫-২৪৩</div>
          <div>তারিখ: ০১.০৯.২৫</div>
        </div>

        <div className="doc-title"><span>ওয়ারিশ সনদপত্র</span></div>

        <p className="body-paragraph">
          এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, <strong>মৃত আয়েশা খাতুন</strong>, পিতা—{" "}
          <strong>মৃত জাবু ভুঁইয়া</strong>, মাতা— <strong>মৃত খুলেসা বিবি</strong>, স্বামী—{" "}
          <strong>কফিল উদ্দিন ওরফে আমু মিয়া</strong>; স্থায়ী ঠিকানা— গ্রাম: <strong>বেতুলী</strong>,
          ডাকঘর: <strong>কাঁচকুড়া</strong>, থানা: <strong>উত্তরখান</strong>, জেলা: <strong>ঢাকা-১২৩০</strong>।
          তিনি ঢাকা উত্তর সিটি কর্পোরেশনের <strong>৪৪ নং ওয়ার্ডের স্থায়ী বাসিন্দা ছিলেন</strong>।
        </p>

        <p className="body-paragraph">
          মৃত আয়েশা খাতুনের মৃত্যুর পর তাঁর আইনগত ওয়ারিশ হিসেবে <strong>৩ (তিন) জন কন্যা জীবিত রয়েছেন</strong>।
          এছাড়া তাঁর <strong>১ (এক) জন পুত্র মৃত্যুবরণ করেছেন</strong>, যিনি মৃত্যুকালে{" "}
          <strong>অবিবাহিত ছিলেন এবং তাঁর কোনো আইনগত ওয়ারিশ নেই</strong>।
        </p>

        <p className="body-paragraph">
          মৃত আয়েশা খাতুনের জীবিত আইনগত ওয়ারিশদের <strong>নাম, জন্মতারিখ, জাতীয় পরিচয়পত্র নম্বর এবং মৃত ব্যক্তির
          সঙ্গে সম্পর্ক</strong> নিম্নে উল্লেখ করা হলো:
        </p>

        <table className="data-table" aria-label="আইনগত ওয়ারিশের তালিকা">
          <colgroup><col /><col /><col /><col /><col /></colgroup>
          <thead>
            <tr>
              <th>ক্রঃ নং</th>
              <th>নাম</th>
              <th>জন্মতারিখ</th>
              <th>জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন নম্বর</th>
              <th>সম্পর্ক</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>১</td>
              <td>অযুফা</td>
              <td>০৪ মার্চ ১৯৫৬</td>
              <td>২৬১৯৬৭৬১৩৩২৪০</td>
              <td>কন্যা</td>
            </tr>
            <tr>
              <td>২</td>
              <td>নাসিমা</td>
              <td>০৮ মার্চ ১৯৮০</td>
              <td>১৪৬৬৭৬৬৮৭৮</td>
              <td>কন্যা</td>
            </tr>
            <tr>
              <td>৩</td>
              <td>তানিয়া আক্তার</td>
              <td>২০ মে ১৯৭৯</td>
              <td>১৯০০৭০১৩৯৮</td>
              <td>কন্যা</td>
            </tr>
            <tr>
              <td>৪</td>
              <td>মৃত নুরুউদিন</td>
              <td>২০ ফেব্রুয়ারী ১৯৭৭</td>
              <td>১৯৭৭৬৭৩৬৮৭৯০০২৯৮১</td>
              <td>পুত্র</td>
            </tr>
          </tbody>
        </table>

        <p className="body-paragraph">
          উপর্যুক্ত ৩ (তিন) জন ছাড়া মৃত আয়েশা খাতুনের আর কোনো পুত্র, কন্যা, স্বামী বা অন্য কোনো আইনগত ওয়ারিশ নেই
          বলে স্থানীয়ভাবে জানা যায় এবং আবেদনকারী কর্তৃক প্রদত্ত তথ্য ও সংশ্লিষ্ট নথিপত্রের ভিত্তিতে এই মর্মে প্রত্যয়ন করা হলো।
        </p>
      </div>

      <div aria-label="কর্তৃপক্ষের স্বাক্ষর ও পরিচয়" className="signatures-area">
        <img
          alt="সুপারিশকারী কর্তৃপক্ষের স্বাক্ষর ও পরিচয়"
          className="authority-image left"
          src="/warish-assets/a1.png"
        />
        <img
          alt="অনুমোদনকারী কর্তৃপক্ষের স্বাক্ষর ও পরিচয়"
          className="authority-image right"
          src="/warish-assets/a2_no_date.png"
        />
      </div>

      <footer className="pad-footer">
        <div className="blue">পরিষ্কার শহর, সুন্দর জীবন</div>
        <div className="red">সমন্বিত উন্নয়নে, বাসযোগ্য ঢাকা</div>
        <div className="green">নাগরিক সহযোগিতায়, এগিয়ে যাক ঢাকা</div>
      </footer>
    </main>
  );
}
