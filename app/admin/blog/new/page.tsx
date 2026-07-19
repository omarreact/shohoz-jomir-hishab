"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const blogSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  slug: z.string().min(3, { message: "Slug is required" }),
  content: z.string().min(10, { message: "Content is required" }),
  status: z.enum(["Published", "Draft"]),
  tags: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function NewBlogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      status: "Draft",
      tags: "",
    },
  });

  const onSubmit = async (data: BlogFormValues) => {
    setIsSubmitting(true);
    try {
      const { db } = await import("@/lib/firebase");
      const { collection, addDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      await addDoc(collection(db, "blogs"), {
        ...data,
        tags: data.tags?.split(",").map((t) => t.trim()).filter(Boolean) || [],
        author: "অ্যাডমিন", // Default
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      console.error("Error creating blog:", error);
      alert("ব্লগ তৈরি করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <div className="space-y-6 fade-in visible">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="outline" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">নতুন ব্লগ</h2>
          <p className="text-muted-foreground mt-1">
            একটি নতুন ব্লগ পোস্ট তৈরি করুন
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ব্লগ তথ্য</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>শিরোনাম (Title)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ব্লগের শিরোনাম লিখুন..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!form.getValues("slug")) {
                              form.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>স্লাগ (Slug)</FormLabel>
                      <FormControl>
                        <Input placeholder="blog-url-slug" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL এর জন্য (যেমন: /blog/slug)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>স্ট্যাটাস (Status)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="" disabled>স্ট্যাটাস নির্বাচন করুন</option>
                          <option value="Draft">ড্রাফট (Draft)</option>
                          <option value="Published">পাবলিশ (Published)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ট্যাগস (Tags)</FormLabel>
                      <FormControl>
                        <Input placeholder="কমা দিয়ে ট্যাগ লিখুন" {...field} />
                      </FormControl>
                      <FormDescription>
                        যেমন: ভূমি, আইন, জরিপ
                      </FormDescription>
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
                      <div className="bg-background rounded-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:border-border [&_.ql-container]:border-border [&_.ql-editor]:min-h-[300px]">
                        <ReactQuill
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
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
                    "সংরক্ষণ হচ্ছে..."
                  ) : (
                    <>
                      <Save size={16} className="mr-2" /> সংরক্ষণ করুন
                    </>
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
