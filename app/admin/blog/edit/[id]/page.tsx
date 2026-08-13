"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/src/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/shared/ui/form";
import { Input } from "@/src/shared/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { CldUploadWidget } from "next-cloudinary";

const blogSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  coverImage: z
    .string()
    .url({ message: "Must be a valid image URL" })
    .or(z.string().min(1, { message: "Cover image URL is required" })),
  category: z.string().min(1, { message: "Category is required" }),
  author: z.string().min(1, { message: "Author is required" }),
  content: z.string().min(10, { message: "Content is required" }),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      coverImage: "",
      category: "",
      author: "মো. ওমর ফারুক",
      content: "",
    },
  });

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  useEffect(() => {
    if (!id) return;
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Not found");
        const { blog } = json.data;
        form.reset({
          title: blog.title || "",
          coverImage: blog.coverImage || "",
          category: blog.category || "",
          author: blog.author || "",
          content: blog.content || "",
        });
      } catch (error) {
        console.error("Error fetching blog:", error);
        alert("ব্লগ লোড করতে সমস্যা হয়েছে।");
        router.push("/admin/blog");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlog();
  }, [id, form, router]);

  const onSubmit = async (data: BlogFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "আপডেট করতে সমস্যা হয়েছে।");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating blog:", error);
      alert(error.message || "ব্লগ আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in visible">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="outline" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ব্লগ এডিট করুন</h2>
          <p className="text-muted-foreground mt-1">ব্লগ পোস্টটি সম্পাদনা করুন</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ব্লগ তথ্য</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>শিরোনাম (Title)</FormLabel>
                      <FormControl>
                        <Input placeholder="ব্লগের শিরোনাম..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>কভার ইমেজ URL (Cover Image)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/image.jpg"
                            className="flex-1"
                            {...field}
                          />
                          <CldUploadWidget
                            signatureEndpoint="/api/cloudinary/sign"
                            onSuccess={(result: any) => {
                              if (result.info?.secure_url) {
                                form.setValue("coverImage", result.info.secure_url);
                              }
                            }}
                          >
                            {({ open }) => (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => { e.preventDefault(); open(); }}
                              >
                                Upload
                              </Button>
                            )}
                          </CldUploadWidget>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>বিভাগ (Category)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="" disabled>বিভাগ নির্বাচন করুন</option>
                          <option value="ডিজিটাল জরিপ">ডিজিটাল জরিপ</option>
                          <option value="ভূমি রেকর্ড">ভূমি রেকর্ড</option>
                          <option value="আইন ও উত্তরাধিকার">আইন ও উত্তরাধিকার</option>
                          <option value="জোনিং">জোনিং</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>লেখক (Author)</FormLabel>
                      <FormControl>
                        <Input placeholder="লেখকের নাম" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>বিস্তারিত (Content)</FormLabel>
                    <FormControl>
                      <div className="bg-background rounded-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:border-border [&_.ql-container]:border-border [&_.ql-editor]:min-h-[400px]">
                        <ReactQuill
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          modules={modules}
                          className="dark:text-foreground"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={isSubmitting} className="px-8">
                  {isSubmitting ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> আপডেট হচ্ছে...</>
                  ) : (
                    <><Save size={16} className="mr-2" /> আপডেট করুন</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
