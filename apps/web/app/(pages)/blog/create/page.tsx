"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import Navbar from "@/components/custom/Navbar";
import {
    FiArrowLeft,
    FiSend,
    FiUploadCloud,
    FiX,
    FiBold,
    FiItalic,
    FiList,
    FiCode,
    FiLink,
    FiMessageSquare,
    FiEye,
    FiEdit2,
    FiRotateCcw,
    FiRotateCw,
} from "react-icons/fi";

function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function CreateBlogPostPage() {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [title, setTitle] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [content, setContent] = useState("");
    const [published, setPublished] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [mode, setMode] = useState<"edit" | "preview">("edit");

    // Undo / Redo History State
    const [history, setHistory] = useState<string[]>([""]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Save history snapshot
    const pushToHistory = (newContent: string) => {
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(newContent);
        if (updatedHistory.length > 50) updatedHistory.shift(); // Max 50 states
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
        setContent(newContent);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setContent(history[prevIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setContent(history[nextIndex]);
        }
    };

    // Text formatting helper
    const insertFormatting = (prefix: string, suffix: string = "", defaultText: string = "text") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end) || defaultText;

        const replacement = `${prefix}${selectedText}${suffix}`;
        const newContent = content.substring(0, start) + replacement + content.substring(end);

        pushToHistory(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selectedText.length
            );
        }, 0);
    };

    // Keyboard Shortcuts Listener (Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+Z, Ctrl+Y)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        if (modifier) {
            const key = e.key.toLowerCase();
            if (key === "b") {
                e.preventDefault();
                insertFormatting("**", "**", "bold text");
            } else if (key === "i") {
                e.preventDefault();
                insertFormatting("*", "*", "italic text");
            } else if (key === "k") {
                e.preventDefault();
                insertFormatting("[", "](https://example.com)", "link text");
            } else if (key === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if (key === "y") {
                e.preventDefault();
                handleRedo();
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be under 5MB.");
            return;
        }

        setUploadingImage(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("You must be logged in to upload images.");
            setUploadingImage(false);
            return;
        }

        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/thumb-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("blog")
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            toast.error(uploadError.message);
            setUploadingImage(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from("blog")
            .getPublicUrl(filePath);

        setThumbnailUrl(publicUrl);
        setUploadingImage(false);
        toast.success("Thumbnail uploaded successfully!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error("Title and Content are required.");
            return;
        }

        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("You must be logged in to publish.");
            setSubmitting(false);
            return;
        }

        const generatedSlug = `${slugify(title)}-${Date.now().toString().slice(-4)}`;

        const { error } = await supabase.from("blog_posts").insert({
            title: title.trim(),
            slug: generatedSlug,
            content: content.trim(),
            thumbnail_url: thumbnailUrl || null,
            author_id: user.id,
            published: published,
        });

        setSubmitting(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success(published ? "Post published!" : "Draft saved!");
        router.push(`/blog/${generatedSlug}`);
    };

    return (
        <div className="min-h-screen text-white">
            <Navbar />

            <div className="max-w-3xl mx-auto mt-10 px-4 pb-20">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-6"
                >
                    <FiArrowLeft size={14} /> Back to Blog
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-extrabold text-white">Create Blog Article</h1>

                    {/* Edit / Preview Tabs */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setMode("edit")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                                mode === "edit" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"
                            }`}
                        >
                            <FiEdit2 size={13} /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("preview")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                                mode === "preview" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"
                            }`}
                        >
                            <FiEye size={13} /> Preview
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-6">
                    {mode === "preview" ? (
                        /* Live Article Preview Card */
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <span className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">
                                    Live Article Preview
                                </span>
                                <h1 className="text-3xl font-black text-white mt-2">
                                    {title || "Untitled Article"}
                                </h1>
                            </div>

                            {thumbnailUrl ? (
                                <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                    <img src={thumbnailUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                </div>
                            ) : null}

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-white/80 leading-relaxed text-sm whitespace-pre-line">
                                {content || <span className="text-white/30 italic">No content written yet...</span>}
                            </div>
                        </div>
                    ) : (
                        /* Edit Form Fields */
                        <>
                            {/* Title */}
                            <div>
                                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Article Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Why Risk Management is Everything in Crypto"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 transition-colors"
                                />
                            </div>

                            {/* Thumbnail Image Uploader */}
                            <div>
                                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Article Cover Image</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {thumbnailUrl ? (
                                    <div className="relative h-48 w-full rounded-xl overflow-hidden border border-white/15 group bg-black/40">
                                        <img src={thumbnailUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailUrl("")}
                                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/[0.07] transition-all cursor-pointer text-center"
                                    >
                                        <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
                                            <FiUploadCloud size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-white">
                                                {uploadingImage ? "Uploading to storage..." : "Click to upload cover image"}
                                            </p>
                                            <p className="text-[11px] text-white/40 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content Editor with Toolbar */}
                            <div>
                                <label className="text-xs font-semibold text-white/60 mb-1.5 block">
                                    Content (Shortcuts: Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+Z, Ctrl+Y)
                                </label>

                                <div className="bg-white/5 border border-white/15 rounded-t-xl p-2 flex flex-wrap items-center gap-1 border-b-0">
                                    {/* Undo / Redo */}
                                    <button
                                        type="button"
                                        title="Undo (Ctrl+Z)"
                                        disabled={historyIndex === 0}
                                        onClick={handleUndo}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                                    >
                                        <FiRotateCcw size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Redo (Ctrl+Y)"
                                        disabled={historyIndex >= history.length - 1}
                                        onClick={handleRedo}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                                    >
                                        <FiRotateCw size={14} />
                                    </button>

                                    <div className="w-px h-4 bg-white/10 mx-1" />

                                    {/* Bold / Italic */}
                                    <button
                                        type="button"
                                        title="Bold (Ctrl+B)"
                                        onClick={() => insertFormatting("**", "**", "bold text")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FiBold size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Italic (Ctrl+I)"
                                        onClick={() => insertFormatting("*", "*", "italic text")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FiItalic size={14} />
                                    </button>

                                    <div className="w-px h-4 bg-white/10 mx-1" />

                                    {/* Headings */}
                                    <button
                                        type="button"
                                        title="Heading 1"
                                        onClick={() => insertFormatting("# ", "", "Main Heading")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                                    >
                                        H1
                                    </button>
                                    <button
                                        type="button"
                                        title="Heading 2"
                                        onClick={() => insertFormatting("## ", "", "Subheading")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                                    >
                                        H2
                                    </button>

                                    <div className="w-px h-4 bg-white/10 mx-1" />

                                    {/* List, Quote, Code, Link */}
                                    <button
                                        type="button"
                                        title="Bullet List"
                                        onClick={() => insertFormatting("- ", "", "List item")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FiList size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Quote"
                                        onClick={() => insertFormatting("> ", "", "Quote text")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FiMessageSquare size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Code Block"
                                        onClick={() => insertFormatting("```\n", "\n```", "code here")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FiCode size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Link (Ctrl+K)"
                                        onClick={() => insertFormatting("[", "](https://example.com)", "link title")}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FiLink size={14} />
                                    </button>
                                </div>

                                <textarea
                                    ref={textareaRef}
                                    rows={12}
                                    placeholder="Write your blog post content here..."
                                    value={content}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        pushToHistory(e.target.value);
                                    }}
                                    className="w-full bg-white/5 border border-white/15 rounded-b-xl p-4 text-sm outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
                                />
                            </div>
                        </>
                    )}

                    {/* Submit Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="accent-purple-600 rounded"
                            />
                            Publish immediately
                        </label>

                        <button
                            type="submit"
                            disabled={submitting || uploadingImage}
                            className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-purple-600 border border-purple-500 hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <FiSend size={14} />
                            {submitting ? "Publishing..." : "Publish Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}