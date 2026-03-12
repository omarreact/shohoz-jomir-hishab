import { Plus, Trash2, Users } from "lucide-react";
import { FULL_UNIT_TIL } from "@/lib/constants";
import { toBn } from "@/lib/utils";

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
                      value={owner.name || ""}
                      onChange={(e) => onUpdateOwner(owner.id, "name", e.target.value)}
                      placeholder={`অংশীদার ${toBn(index + 1)}`}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">সম্পর্কের ধরন</label>
                    <input
                      type="text"
                      className="form-control"
                      value={owner.relation || ""}
                      onChange={(e) => onUpdateOwner(owner.id, "relation", e.target.value)}
                      placeholder="যেমন: পিতা/মাতা/ভাই/বোন"
                    />
                  </div>
                  <div className="col-12 mt-4">
                    <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">খতিয়ানের হিস্যা (অংশ)</h6>
                    <div className="row g-2">
                      <div className="col-3">
                        <label className="form-label small text-muted">আনা</label>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={owner.share?.ana || ""}
                          onChange={(e) => onUpdateOwner(owner.id, "ana", e.target.value)}
                          min="0" max="16" placeholder="0"
                        />
                      </div>
                      <div className="col-3">
                        <label className="form-label small text-muted">গন্ডা</label>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={owner.share?.gonda || ""}
                          onChange={(e) => onUpdateOwner(owner.id, "gonda", e.target.value)}
                          min="0" max="19" placeholder="0"
                        />
                      </div>
                      <div className="col-3">
                        <label className="form-label small text-muted">কড়া</label>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={owner.share?.kora || ""}
                          onChange={(e) => onUpdateOwner(owner.id, "kora", e.target.value)}
                          min="0" max="3" placeholder="0"
                        />
                      </div>
                      <div className="col-3">
                        <label className="form-label small text-muted">ক্রান্তি</label>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={owner.share?.kranti || ""}
                          onChange={(e) => onUpdateOwner(owner.id, "kranti", e.target.value)}
                          min="0" max="2" placeholder="0"
                        />
                      </div>
                      <div className="col-12 mt-2">
                        <label className="form-label small text-muted">তিল</label>
                        <input
                          type="number"
                          className="form-control text-center w-50"
                          value={owner.share?.til || ""}
                          onChange={(e) => onUpdateOwner(owner.id, "til", e.target.value)}
                          min="0" max="19" placeholder="0"
                        />
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