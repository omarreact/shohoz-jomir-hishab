"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";

type Blog = {
  id: string;
  title: string;
  slug: string;
  author: string;
  status: string;
  createdAt: string;
  category?: string;
  categorySlug?: string;
  readingTime?: string;
};

export default function BlogManagementPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      if (!res.ok) throw new Error("Failed to fetch blogs");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setBlogs(json.data.blogs ?? []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ব্লগটি মুছে ফেলতে চান?")) return;

    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to delete");
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (error: any) {
      console.error("Error deleting blog:", error);
      alert(error.message || "ব্লগ মুছতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-6 fade-in visible">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ব্লগ ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground mt-2">আপনার ওয়েবসাইটের সমস্ত ব্লগ পোস্ট পরিচালনা করুন।</p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="flex items-center gap-2">
            <Plus size={16} /> নতুন ব্লগ
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>সকল ব্লগ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              কোনো ব্লগ পাওয়া যায়নি। নতুন ব্লগ তৈরি করুন।
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>শিরোনাম</TableHead>
                    <TableHead>লেখক</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.title}</TableCell>
                      <TableCell>{blog.author || "অ্যাডমিন"}</TableCell>
                      <TableCell>
                        {blog.createdAt
                          ? format(new Date(blog.createdAt), "dd MMM, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            blog.status === "Published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {blog.status === "Published" ? "পাবলিশড" : "ড্রাফট"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/blog/${blog.categorySlug || "general"}/${blog.slug || blog.id}`}
                            target="_blank"
                          >
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Link href={`/admin/blog/edit/${blog.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => deleteBlog(blog.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
