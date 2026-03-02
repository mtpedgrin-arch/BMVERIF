import { prisma } from "../lib/prisma";

export default async function sitemap() {
  const staticRoutes = [
    {
      url: "https://bmverificada.space",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://bmverificada.space/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://bmverificada.space/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  let blogRoutes = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    blogRoutes = posts.map((post) => ({
      url: `https://bmverificada.space/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // If BlogPost table doesn't exist yet, skip blog routes
  }

  return [...staticRoutes, ...blogRoutes];
}
