"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/custom/Navbar";
import { FiArrowLeft, FiCalendar, FiUser } from "react-icons/fi";

type BlogPost = {
    id: string;
    title: string;
    content: string;
    thumbnail_url: string | null;
    created_at: string;
    profiles: {
        name: string;
        username: string;
        image_url: string | null;
    } | null;
};

// Inline Markdown Parser for Rich Text Formatting
function parseInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|\[(.*?)\]\((.*?)\))/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        if (match[1].startsWith("**")) {
            parts.push(<strong key={match.index} className="font-bold text-white">{match[2]}</strong>);
        } else if (match[1].startsWith("*")) {
            parts.push(<em key={match.index} className="italic text-purple-200">{match[3]}</em>);
        } else if (match[1].startsWith("[")) {
            parts.push(
                <a
                    key={match.index}
                    href={match[5]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                    {match[4]}
                </a>
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}

function renderFormattedMarkdown(content: string) {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                elements.push(
                    <pre key={`code-${index}`} className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-purple-300 overflow-x-auto my-3">
                        <code>{codeBuffer.join("\n")}</code>
                    </pre>
                );
                codeBuffer = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            return;
        }

        const trimmed = line.trim();

        if (!trimmed) {
            elements.push(<div key={`space-${index}`} className="h-2" />);
            return;
        }

        if (trimmed.startsWith("# ")) {
            elements.push(
                <h1 key={index} className="text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-3">
                    {parseInline(trimmed.slice(2))}
                </h1>
            );
        } else if (trimmed.startsWith("## ")) {
            elements.push(
                <h2 key={index} className="text-xl sm:text-2xl font-bold text-white mt-5 mb-2">
                    {parseInline(trimmed.slice(3))}
                </h2>
            );
        } else if (trimmed.startsWith("### ")) {
            elements.push(
                <h3 key={index} className="text-lg font-bold text-purple-300 mt-4 mb-2">
                    {parseInline(trimmed.slice(4))}
                </h3>
            );
        } else if (trimmed.startsWith("> ")) {
            elements.push(
                <blockquote key={index} className="border-l-4 border-purple-500 bg-purple-500/10 p-4 rounded-r-xl italic text-white/90 my-3">
                    {parseInline(trimmed.slice(2))}
                </blockquote>
            );
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            elements.push(
                <li key={index} className="ml-5 list-disc text-white/80 my-1 leading-relaxed">
                    {parseInline(trimmed.slice(2))}
                </li>
            );
        } else {
            elements.push(
                <p key={index} className="text-white/80 leading-relaxed my-2">
                    {parseInline(trimmed)}
                </p>
            );
        }
    });

    return elements;
}

export default function SingleBlogPostPage() {
    const params = useParams<{ slug: string }>();
    const supabase = createClient();

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            const slug = params.slug;
            if (!slug) return;

            const { data } = await supabase
                .from("blog_posts")
                .select(`
                    id, title, content, thumbnail_url, created_at,
                    profiles ( name, username, image_url )
                `)
                .eq("slug", slug)
                .single();

            setPost((data as unknown as BlogPost) ?? null);
            setLoading(false);
        };

        fetchPost();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen text-white">
                <Navbar />
                <div className="max-w-3xl mx-auto mt-10 px-4 animate-pulse">
                    <div className="h-6 w-32 bg-white/10 rounded mb-6" />
                    <div className="h-10 w-3/4 bg-white/10 rounded mb-4" />
                    <div className="h-64 bg-white/5 border border-white/10 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen text-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
                    <p className="text-lg font-semibold">Article not found.</p>
                    <Link href="/blog" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                        ← Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const authorUsername = post.profiles?.username;

    return (
        <div className="min-h-screen text-white">
            <Navbar />

            <div className="max-w-3xl mx-auto mt-10 px-4 pb-20">
                <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-6">
                    <FiArrowLeft size={14} /> Back to Blog
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{post.title}</h1>

                    <div className="flex items-center gap-4 text-xs text-white/50 mt-4 pb-6 border-b border-white/10">
                        <Link
                            href={`/${authorUsername}`}
                            className="group flex items-center gap-2 hover:text-purple-300 transition-colors"
                        >
                            {post.profiles?.image_url ? (
                                <img
                                    src={post.profiles.image_url}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover group-hover:ring-2 group-hover:ring-purple-500 transition-all"
                                />
                            ) : (
                                <div className="p-1 rounded-full bg-white/10 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                                    <FiUser size={13} />
                                </div>
                            )}
                            <span className="text-white/80 font-semibold group-hover:text-purple-300 group-hover:underline underline-offset-4 transition-colors">
                                {post.profiles?.name || authorUsername}
                            </span>
                        </Link>

                        <span className="flex items-center gap-1">
                            <FiCalendar size={13} /> {formattedDate}
                        </span>
                    </div>
                </div>

                {post.thumbnail_url && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center max-h-96">
                        <img src={post.thumbnail_url} alt={post.title} className="w-full max-h-96 object-contain" />
                    </div>
                )}

                {/* Formatted Content Container */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-10 space-y-2 text-sm sm:text-base">
                    {renderFormattedMarkdown(post.content)}
                </div>
            </div>
        </div>
    );
}