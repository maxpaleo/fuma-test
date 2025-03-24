import fs from "fs";
import { globby } from "globby";
import matter from "gray-matter";
import path from "path";
import removeMd from "remove-markdown";

const docsDir = path.join(process.cwd(), "content");
const outFile = path.join(process.cwd(), "config/search-index.json");

async function generateSearchIndex() {
  const files = await globby("**/*.mdx", { cwd: docsDir });

  const index = files.map((file) => {
    const fullPath = path.join(docsDir, file);
    const source = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(source);

    const slug = file.replace(/\.mdx?$/, "");
    const title = data.title || slug;

    // Clean the content: remove JSX, MD, code, etc.
    const cleanContent = removeMd(
      content
        // Remove code blocks (```...```)
        .replace(/```[\s\S]*?```/g, "")
        // Remove inline code (`...`)
        .replace(/`[^`]*`/g, "")
        // Remove images ![alt](url)
        .replace(/!\[.*?\]\(.*?\)/g, "")
        // Remove markdown links [text](url)
        .replace(/\[.*?\]\(.*?\)/g, "")
        // Remove JSX/HTML tags
        .replace(/<[^>]+>/g, "")
        // Remove markdown tables (header row + separator)
        .replace(/^\s*\|.*\|\s*$/gm, "")
        .replace(/^\s*[-|:]+\s*$/gm, "")
        // Remove excessive spacing, newlines
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
    );

    return {
      title,
      slug: `/docs/${slug}`,
      content: cleanContent.trim(),
    };
  });

  fs.writeFileSync(outFile, JSON.stringify(index, null, 2));
  console.log("✅ Search index generated!");
}

generateSearchIndex();
