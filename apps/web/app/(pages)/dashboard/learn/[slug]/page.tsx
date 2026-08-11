"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheckCircle,
    FiCircle,
    FiBookOpen,
} from "react-icons/fi";

type Lesson = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    content: string;
    order_index: number;
};

type AdjacentLesson = {
    slug: string;
    title: string;
} | null;

// Helper to render inline **bold** text
function FormattedInlineText({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={i} className="font-bold text-purple-300">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return part;
            })}
        </>
    );
}

// Markdown Renderer Component for Headings, Lists, Images, and Paragraphs
function LessonMarkdownRenderer({ content }: { content: string }) {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    return (
        <div className="space-y-4 text-white/80 leading-relaxed text-sm sm:text-base">
            {lines.map((line, index) => {
                // 1. Image Markdown: ![alt](url)
                const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                    const [, alt, src] = imgMatch;
                    return (
                        <div key={index} className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg">
                            <img src={src} alt={alt} className="w-full max-h-[420px] object-cover" />
                            {alt && (
                                <p className="p-3 text-center text-xs text-white/50 bg-white/5 border-t border-white/10">
                                    {alt}
                                </p>
                            )}
                        </div>
                    );
                }

                // 2. Headings
                if (line.startsWith("# ")) {
                    return (
                        <h1 key={index} className="text-2xl font-extrabold text-white pt-4 pb-2 border-b border-white/10">
                            {line.replace("# ", "")}
                        </h1>
                    );
                }
                if (line.startsWith("## ")) {
                    return (
                        <h2 key={index} className="text-xl font-bold text-purple-300 pt-4">
                            {line.replace("## ", "")}
                        </h2>
                    );
                }
                if (line.startsWith("### ")) {
                    return (
                        <h3 key={index} className="text-lg font-semibold text-white pt-2">
                            {line.replace("### ", "")}
                        </h3>
                    );
                }

                // 3. Bullet points
                if (line.startsWith("- ") || line.startsWith("* ")) {
                    const bulletText = line.replace(/^[-*]\s+/, "");
                    return (
                        <div key={index} className="flex items-start gap-3 pl-2 my-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                            <p className="text-white/80">
                                <FormattedInlineText text={bulletText} />
                            </p>
                        </div>
                    );
                }

                // 4. Standard paragraph
                return (
                    <p key={index} className="text-white/80 leading-relaxed">
                        <FormattedInlineText text={line} />
                    </p>
                );
            })}
        </div>
    );
}

export default function LessonPage() {
    const params = useParams<{ slug: string }>();
    const supabase = createClient();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [prevLesson, setPrevLesson] = useState<AdjacentLesson>(null);
    const [nextLesson, setNextLesson] = useState<AdjacentLesson>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchLessonData = async () => {
            const slug = params.slug;
            if (!slug) return;

            setLoading(true);

            // 1. Fetch target lesson
            const { data: currentLesson, error } = await supabase
                .from("lessons")
                .select("id, slug, title, description, content, order_index")
                .eq("slug", slug)
                .single();

            if (error || !currentLesson) {
                setLoading(false);
                return;
            }

            setLesson(currentLesson);

            // 2. Fetch User & Completion Status
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: progress } = await supabase
                    .from("user_lesson_progress")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("lesson_id", currentLesson.id)
                    .maybeSingle();

                setIsCompleted(Boolean(progress));
            }

            // 3. Fetch Previous & Next Lessons
            const { data: prevData } = await supabase
                .from("lessons")
                .select("slug, title")
                .lt("order_index", currentLesson.order_index)
                .order("order_index", { ascending: false })
                .limit(1)
                .maybeSingle();

            const { data: nextData } = await supabase
                .from("lessons")
                .select("slug, title")
                .gt("order_index", currentLesson.order_index)
                .order("order_index", { ascending: true })
                .limit(1)
                .maybeSingle();

            setPrevLesson(prevData ?? null);
            setNextLesson(nextData ?? null);

            setLoading(false);
        };

        fetchLessonData();
    }, [params.slug]);

    const handleToggleComplete = async () => {
        if (!userId || !lesson) {
            toast.error("Please sign in to save your progress");
            return;
        }

        setToggling(true);

        if (isCompleted) {
            const { error } = await supabase
                .from("user_lesson_progress")
                .delete()
                .eq("user_id", userId)
                .eq("lesson_id", lesson.id);

            if (error) {
                toast.error(error.message);
            } else {
                setIsCompleted(false);
                toast.success("Marked as incomplete");
            }
        } else {
            const { error } = await supabase
                .from("user_lesson_progress")
                .insert({ user_id: userId, lesson_id: lesson.id });

            if (error) {
                toast.error(error.message);
            } else {
                setIsCompleted(true);
                toast.success("Lesson completed!");
            }
        }

        setToggling(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white">
                <DashboardNavbar />
                <div className="max-w-4xl mx-auto mt-10 px-4 animate-pulse">
                    <div className="h-5 w-32 bg-white/10 rounded mb-6" />
                    <div className="h-10 w-2/3 bg-white/10 rounded mb-4" />
                    <div className="h-64 bg-white/5 border border-white/10 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen text-white">
                <DashboardNavbar />
                <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
                    <p className="text-lg font-semibold">Lesson not found.</p>
                    <Link href="/dashboard/learn" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                        ← Back to Academy
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />

            <div className="max-w-4xl mx-auto mt-10 px-4 pb-20">
                {/* Back Link */}
                <Link
                    href="/dashboard/learn"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-6"
                >
                    <FiArrowLeft size={14} />
                    Back to Trading Academy
                </Link>

                {/* Header Card */}
                <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-2xl p-6 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-md w-fit flex items-center gap-1.5">
                            <FiBookOpen size={13} />
                            Module {lesson.order_index}
                        </span>

                        <button
                            onClick={handleToggleComplete}
                            disabled={toggling}
                            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 w-fit ${
                                isCompleted
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                    : "bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                            }`}
                        >
                            {isCompleted ? <FiCheckCircle size={15} /> : <FiCircle size={15} />}
                            {isCompleted ? "Completed" : "Mark as Complete"}
                        </button>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{lesson.title}</h1>
                    {lesson.description && (
                        <p className="text-sm text-white/60 mt-2 leading-relaxed">{lesson.description}</p>
                    )}
                </div>

                {/* Lesson Body */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-10">
                    <LessonMarkdownRenderer content={lesson.content} />
                </div>

                {/* Footer Navigation */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prevLesson ? (
                        <Link
                            href={`/dashboard/learn/${prevLesson.slug}`}
                            className="flex flex-col gap-1 p-4 bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-xl transition-all group"
                        >
                            <span className="text-[11px] uppercase tracking-wider text-white/40 flex items-center gap-1">
                                <FiArrowLeft size={12} /> Previous Module
                            </span>
                            <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {prevLesson.title}
                            </span>
                        </Link>
                    ) : <div />}

                    {nextLesson ? (
                        <Link
                            href={`/dashboard/learn/${nextLesson.slug}`}
                            className="flex flex-col gap-1 p-4 bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-xl transition-all sm:items-end group"
                        >
                            <span className="text-[11px] uppercase tracking-wider text-white/40 flex items-center gap-1">
                                Next Module <FiArrowRight size={12} />
                            </span>
                            <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {nextLesson.title}
                            </span>
                        </Link>
                    ) : <div />}
                </div>
            </div>
        </div>
    );
}