"use client";

import React from "react";
import { Users, Activity, MapPin, Server, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="fade-in">
      <h3 className="fw-bold text-dark mb-4">অ্যাডমিন ড্যাশবোর্ড</h3>
      <div className="row g-4 mb-4">
        {[
          {
            title: "মোট ইউজার",
            val: "১,২৪৫",
            icon: Users,
            color: "bg-primary",
          },
          { title: "API হিট", val: "৪,৮৯০", icon: Server, color: "bg-success" },
          { title: "খতিয়ান", val: "৩,০১২", icon: MapPin, color: "bg-warning" },
          {
            title: "স্ট্যাটাস",
            val: "Active",
            icon: Activity,
            color: "bg-danger",
          },
        ].map((stat, i) => (
          <div className="col-md-3" key={i}>
            <div
              className={`card shadow-sm border-0 rounded-4 ${stat.color} text-white h-100`}
            >
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 opacity-75">{stat.title}</p>
                  <h2 className="fw-bold mb-0">{stat.val}</h2>
                </div>
                <stat.icon size={40} className="opacity-50" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* API কন্ট্রোল প্যানেল এরিয়া */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">রাজউক API কন্ট্রোল</h5>
          <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
            <div>
              <h6 className="fw-bold">অটোমেটিক টোকেন জেনারেটর</h6>
              <small>প্রতি ৩ মাস পর টোকেন আপডেট</small>
            </div>
            <button className="btn btn-outline-primary rounded-pill">
              <RefreshCw size={16} className="me-2" /> রিফ্রেশ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
