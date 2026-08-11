"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/custom/Navbar";
import { FiEdit3, FiCalendar, FiUser } from "react-icons/fi";

type BlogPost = {
    id: string;
    slug: string;
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

export default function BlogFeedPage() {
    const supabase = createClient();

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(Boolean(user));

            const { data } = await supabase
                .from("blog_posts")
                .select(`
                    id, slug, title, content, thumbnail_url, created_at,
                    profiles ( name, username, image_url )
                `)
                .eq("published", true)
                .order("created_at", { ascending: false });

            setPosts((data as unknown as BlogPost[]) ?? []);
            setLoading(false);
        };

        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen text-white">
            <Navbar />

            <div className="max-w-5xl mx-auto mt-10 px-4 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">Community Blog</h1>
                        <p className="text-sm text-white/50 mt-1">Insights, trade breakdowns, and analysis from traders.</p>
                    </div>

                    {isLoggedIn && (
                        <Link
                            href="/blog/create"
                            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-purple-600 border border-purple-500 text-white hover:bg-purple-700 transition-colors w-fit"
                        >
                            <FiEdit3 size={15} />
                            Write a Post
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        <div className="h-72 bg-white/5 border border-white/10 rounded-2xl" />
                        <div className="h-72 bg-white/5 border border-white/10 rounded-2xl" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40 text-sm">
                        No articles published yet. {isLoggedIn && "Be the first to share your thoughts!"}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {posts.map((post) => {
                            const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            });

                            const authorName = post.profiles?.name || post.profiles?.username;
                            const authorUsername = post.profiles?.username;

                            return (
                                <div
                                    key={post.id}
                                    className="group bg-white/5 border border-white/10 hover:border-purple-500/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:bg-white/[0.07]"
                                >
                                    <Link href={`/blog/${post.slug}`} className="block">
                                        {post.thumbnail_url && (
                                            <div className="h-44 w-full overflow-hidden bg-black/40 border-b border-white/10">
                                                <img
                                                    src={post.thumbnail_url}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>
                                            <p className="text-xs text-white/50 mt-2 line-clamp-3 leading-relaxed">
                                                {post.content.replace(/[#*!\[\]()]/g, "")}
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Author & Date Footer */}
                                    <div className="px-6 pb-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                                        {authorName ? (
                                            authorUsername ? (
                                                <Link
                                                    href={`/${authorUsername}`}
                                                    className="group/author flex items-center gap-2 hover:text-purple-300 transition-colors"
                                                >
                                                    {post.profiles?.image_url ? (
                                                        <img
                                                            src={post.profiles.image_url}
                                                            alt=""
                                                            className="w-5 h-5 rounded-full object-cover group-hover/author:ring-1 group-hover/author:ring-purple-400"
                                                        />
                                                    ) : (
                                                        <FiUser size={13} className="group-hover/author:text-purple-400" />
                                                    )}
                                                    <span className="text-white/70 font-medium group-hover/author:text-purple-300 group-hover/author:underline underline-offset-2">
                                                        {authorName}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {post.profiles?.image_url ? (
                                                        <img
                                                            src={post.profiles.image_url}
                                                            alt=""
                                                            className="w-5 h-5 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <FiUser size={13} />
                                                    )}
                                                    <span className="text-white/70 font-medium">{authorName}</span>
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <FiUser size={13} />
                                                <span className="text-white/70 font-medium">Anonymous</span>
                                            </div>
                                        )}

                                        <span className="flex items-center gap-1">
                                            <FiCalendar size={12} />
                                            {formattedDate}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}