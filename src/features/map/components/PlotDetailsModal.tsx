import { MapPin } from "lucide-react";

interface PlotDetailsModalProps {
  rsData: any;
  onClose: () => void;
}

export function PlotDetailsModal({ rsData, onClose }: PlotDetailsModalProps) {
  if (!rsData) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white border-0 py-3">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <MapPin size={20} className="me-2 text-primary" />
              দাগ নং {rsData.rs_plot_no || rsData.plot_no} — বিস্তারিত তথ্য
            </h5>
            <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose}></button>
          </div>
          <div className="modal-body bg-light p-4">
            <div className="table-responsive bg-white rounded-3 shadow-sm border">
              <table className="table table-hover table-bordered mb-0 align-middle">
                <tbody>
                  {Object.entries(rsData)
                    .filter(([key, value]) => value !== null && value !== "" && value !== " " && !["id", "objectid", "globalid", "shape", "geometry", "st_area(shape)", "st_length(shape)"].includes(key.toLowerCase()))
                    .map(([key, value]) => {
                      const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
                      const formattedKey = key.replace(/([A-Z])/g, " $1").toUpperCase();
                      return (
                        <tr key={key}>
                          <th className="bg-light text-secondary px-3 py-2 align-middle text-uppercase" style={{ width: "40%", fontSize: "13px" }}>
                            {formattedKey}
                          </th>
                          <td className="text-dark fw-bold px-3 py-2 align-middle" style={{ fontSize: "14px", wordBreak: "break-word" }}>
                            {displayValue}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer bg-white border-top py-2">
            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose}>বন্ধ করুন</button>
          </div>
        </div>
      </div>
    </div>
  );
}
