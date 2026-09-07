import { notFound } from "next/navigation";
import { collections } from "@/src/modules/database/firebaseAdmin";
import type { Metadata } from "next";

interface PageData {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches page data from Firestore based on the slug.
 * This is a server-side function that runs on the server, not in the browser.
 */
async function getPage(slug: string): Promise<PageData | null> {
  const snapshot = await collections.pages.where("slug", "==", slug).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title,
    slug: data.slug,
    category: data.category,
    content: data.content,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getPage(params.slug);

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: `${page.title} | Shohoz Jomir Hishab`,
    description: `Information about ${page.title}`,
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <article className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">{page.title}</h1>
        {/* The content is assumed to be safe HTML from a trusted source (e.g., an admin). */}
        <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </main>
  );
}