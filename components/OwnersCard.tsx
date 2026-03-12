import { Plus, Trash2, Users } from "lucide-react";
import { toBn } from "@/lib/utils";
// আপনার তৈরি করা অপশনগুলো এখানে ইমপোর্ট করা হলো
import { anaOptions, gondaOptions, koraOptions, krantiOptions, tilOptions } from "@/lib/options";

export default function OwnersCard({
  owners,
  onAddOwner,
  onRemoveOwner,
  onUpdateOwner,
}: any) {

  return (
    <div className="col-lg-6">
      <div className="card h-100 shadow-sm border-primary">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <Users size={20} className="me-2" /> অংশীদার/ওয়ারিশের তথ্য
          </h5>
          <button
            onClick={onAddOwner}
            className="btn btn-sm btn-light text-primary fw-bold"
          >
            <Plus size={16} /> নতুন যোগ করুন
          </button>
        </div>
        <div className="card-body bg-light p-3 p-md-4">
          {owners?.map((owner: any, index: number) => (
            <div key={owner.id} className="card mb-3 border-0 shadow-sm">
              <div className="card-body position-relative p-3 p-md-4">
                {owners.length > 1 && (
                  <button
                    onClick={() => onRemoveOwner(owner.id)}
                    className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 rounded-circle p-1"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">অংশীদারের নাম</label>
                    <input
                      type="text"
                      className="form-control"
                      value={owner.n || ""}
                      onChange={(e) => onUpdateOwner(owner.id, "n", e.target.value)}
                      placeholder={`অংশীদার ${toBn(index + 1)}`}
                    />
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">সম্পর্ক</label>
                    <select
                      className="form-select"
                      value={owner.rType || "পিতা"}
                      onChange={(e) => onUpdateOwner(owner.id, "rType", e.target.value)}
                    >
                      <option value="পিতা">পিতা</option>
                      <option value="মাতা">মাতা</option>
                      <option value="স্বামী">স্বামী</option>
                      <option value="স্ত্রী">স্ত্রী</option>
                    </select>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label small fw-bold text-secondary">পিতা/স্বামীর নাম</label>
                    <input
                      type="text"
                      className="form-control"
                      value={owner.rName || ""}
                      onChange={(e) => onUpdateOwner(owner.id, "rName", e.target.value)}
                      placeholder="নাম লিখুন"
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">খতিয়ানের হিস্যা (অংশ)</h6>
                    <div className="row g-2">
                      <div className="col-4 col-md-2">
                        <label className="form-label small text-muted">আনা</label>
                        <select
                          className="form-select text-center px-0"
                          style={{fontSize: '14px'}}
                          value={owner.a || 0}
                          onChange={(e) => onUpdateOwner(owner.id, "a", Number(e.target.value))}
                        >
                          {anaOptions.map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-4 col-md-2">
                        <label className="form-label small text-muted">গন্ডা</label>
                        <select
                          className="form-select text-center px-1"
                          style={{fontSize: '14px'}}
                          value={owner.g || 0}
                          onChange={(e) => onUpdateOwner(owner.id, "g", Number(e.target.value))}
                        >
                          {gondaOptions.map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-4 col-md-2">
                        <label className="form-label small text-muted">কড়া</label>
                        <select
                          className="form-select text-center px-0"
                          style={{fontSize: '14px'}}
                          value={owner.k || 0}
                          onChange={(e) => onUpdateOwner(owner.id, "k", Number(e.target.value))}
                        >
                          {koraOptions.map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small text-muted">ক্রান্তি</label>
                        <select
                          className="form-select text-center px-0"
                          style={{fontSize: '14px'}}
                          value={owner.kr || 0}
                          onChange={(e) => onUpdateOwner(owner.id, "kr", Number(e.target.value))}
                        >
                          {krantiOptions.map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small text-muted">তিল</label>
                        <select
                          className="form-select text-center px-1"
                          style={{fontSize: '14px'}}
                          value={owner.ti || 0}
                          onChange={(e) => onUpdateOwner(owner.id, "ti", Number(e.target.value))}
                        >
                          {tilOptions.map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

