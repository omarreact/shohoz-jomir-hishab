import { Plus, Trash2, Users } from "lucide-react";
import { toBn } from "@/lib/utils";
import type { KhatiyanOwner, RelationTypeBn } from "@/lib/types";
import {
  anaOptions,
  gondaOptions,
  koraOptions,
  krantiOptions,
  tilOptions,
} from "@/lib/options";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

interface OwnersCardProps {
  owners: KhatiyanOwner[];
  onAddOwner: () => void;
  onRemoveOwner: (id: number) => void;
  onUpdateOwner: <Key extends keyof KhatiyanOwner>(
    id: number,
    field: Key,
    value: KhatiyanOwner[Key],
  ) => void;
}

export default function OwnersCard({
  owners,
  onAddOwner,
  onRemoveOwner,
  onUpdateOwner,
}: OwnersCardProps) {
  return (
    <Card className="h-full flex flex-col border-primary">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-xl flex flex-row justify-between items-center py-4">
        <CardTitle className="text-lg flex items-center m-0">
          <Users size={18} className="mr-2" /> অংশীদার/ওয়ারিশের তথ্য
        </CardTitle>
        <Button
          onClick={onAddOwner}
          variant="secondary"
          size="sm"
          className="font-bold flex items-center"
        >
          <Plus size={14} className="mr-1" /> নতুন যোগ
        </Button>
      </CardHeader>
      
      <CardContent className="bg-muted/30 flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {owners.map((owner, index) => (
            <Card key={owner.id} className="p-4 shadow-sm border-border relative group">
              {owners.length > 1 && (
                <Button
                  onClick={() => onRemoveOwner(owner.id)}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-70 group-hover:opacity-100 transition-opacity z-10"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={14} />
                </Button>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                    অংশীদারের নাম
                  </label>
                  <Input
                    type="text"
                    value={owner.n || ""}
                    onChange={(e) =>
                      onUpdateOwner(owner.id, "n", e.target.value)
                    }
                    placeholder={`অংশীদার ${toBn(index + 1)}`}
                    className="h-9"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                      সম্পর্ক
                    </label>
                    <select
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-input"
                      value={owner.rType || "পিতা"}
                      onChange={(e) =>
                        onUpdateOwner(
                          owner.id,
                          "rType",
                          e.target.value as RelationTypeBn,
                        )
                      }
                    >
                      <option value="পিতা">পিতা</option>
                      <option value="মাতা">মাতা</option>
                      <option value="স্বামী">স্বামী</option>
                      <option value="স্ত্রী">স্ত্রী</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                      পিতা/স্বামীর নাম
                    </label>
                    <Input
                      type="text"
                      value={owner.rName || ""}
                      onChange={(e) =>
                        onUpdateOwner(owner.id, "rName", e.target.value)
                      }
                      placeholder="নাম লিখুন"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-2">
                  <h6 className="font-bold text-foreground mb-3 text-sm">
                    খতিয়ানের হিস্যা (অংশ)
                  </h6>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-muted-foreground">আনা</label>
                      <select
                        className="flex h-8 w-full text-center px-1 text-xs justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={owner.a?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "a", Number(e.target.value))
                        }
                      >
                        {anaOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-muted-foreground">গন্ডা</label>
                      <select
                        className="flex h-8 w-full text-center px-1 text-xs justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={owner.g?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "g", Number(e.target.value))
                        }
                      >
                        {gondaOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-muted-foreground">কড়া</label>
                      <select
                        className="flex h-8 w-full text-center px-1 text-xs justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={owner.k?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "k", Number(e.target.value))
                        }
                      >
                        {koraOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-muted-foreground">ক্রান্তি</label>
                      <select
                        className="flex h-8 w-full text-center px-1 text-xs justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={owner.kr?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "kr", Number(e.target.value))
                        }
                      >
                        {krantiOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-muted-foreground">তিল</label>
                      <select
                        className="flex h-8 w-full text-center px-1 text-xs justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={owner.ti?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "ti", Number(e.target.value))
                        }
                      >
                        {tilOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
