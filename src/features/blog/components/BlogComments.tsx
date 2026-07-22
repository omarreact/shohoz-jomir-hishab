"use client";

import { useState, useEffect } from "react";
import { Clock, Loader2, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

type Comment = {
  id: string;
  blogId: string;
  name: string;
  text: string;
  createdAt: string;
};

export default function BlogComments({ blogId }: { blogId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?blogId=${encodeURIComponent(blogId)}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, name: name.trim(), text: text.trim() }),
      });

      if (!res.ok) throw new Error("Failed to submit comment");
      const { comment } = await res.json();

      setComments([comment, ...comments]);
      setName("");
      setText("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("কমেন্ট যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "এইমাত্র";
    return new Date(dateStr).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-12 bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm">
      <h3 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <MessageCircle size={24} className="text-primary" />
        মতামত ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-10 space-y-4 bg-muted/50 p-6 rounded-lg border border-border/50">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">আপনার নাম</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম লিখুন"
            required
            className="bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">আপনার মতামত</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="আপনার মতামত বা প্রশ্ন লিখুন..."
            required
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="px-6 gap-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            পোস্ট করুন
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 p-4 rounded-lg bg-background border border-border/50 transition-all hover:border-border"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {comment.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1 sm:gap-4">
                  <h4 className="font-semibold text-foreground truncate">{comment.name}</h4>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock size={12} />
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 px-4 bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground mb-2">এখনো কোনো মতামত নেই।</p>
            <p className="text-sm text-muted-foreground/80">প্রথম মতামতটি আপনার হোক!</p>
          </div>
        )}
      </div>
    </div>
  );
}
