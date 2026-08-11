"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";
import { FiBookOpen, FiCheckCircle, FiClock, FiArrowRight } from "react-icons/fi";

type Lesson = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    order_index: number;
};

export default function LearnDashboardPage() {
    const supabase = createClient();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLearnData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch lessons with thumbnail_url
            const { data: lessonsData } = await supabase
                .from("lessons")
                .select("id, slug, title, description, thumbnail_url, order_index")
                .order("order_index", { ascending: true });

            setLessons(lessonsData ?? []);

            if (user) {
                const { data: progressData } = await supabase
                    .from("user_lesson_progress")
                    .select("lesson_id")
                    .eq("user_id", user.id);

                if (progressData) {
                    setCompletedLessonIds(new Set(progressData.map((p) => p.lesson_id)));
                }
            }

            setLoading(false);
        };

        fetchLearnData();
    }, []);

    const totalLessons = lessons.length;
    const completedCount = completedLessonIds.size;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    if (loading) {
        return (
            <div className="min-h-screen text-white">
                <DashboardNavbar />
                <div className="max-w-5xl mx-auto mt-10 px-4 animate-pulse">
                    <div className="h-8 w-48 bg-white/10 rounded mb-4" />
                    <div className="h-20 bg-white/5 border border-white/10 rounded-2xl mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl" />
                        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />

            <div className="max-w-5xl mx-auto mt-10 px-4 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold flex items-center gap-2">
                        <FiBookOpen className="text-purple-400" />
                        Trading Academy
                    </h1>
                    <p className="text-sm text-white/50 mt-1">
                        Master trading fundamentals, technical analysis, and risk management at your own pace.
                    </p>
                </div>

                {/* Progress Banner */}
                <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Your Progress</p>
                            <p className="text-lg font-bold text-white mt-0.5">
                                {completedCount} of {totalLessons} Modules Completed
                            </p>
                        </div>
                        <span className="text-2xl font-black text-purple-400">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-purple-600 to-indigo-500 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lessons.map((lesson, idx) => {
                        const isCompleted = completedLessonIds.has(lesson.id);

                        return (
                            <Link
                                key={lesson.id}
                                href={`/dashboard/learn/${lesson.slug}`}
                                className="group relative bg-white/5 border border-white/10 hover:border-purple-500/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:bg-white/[0.07]"
                            >
                                <div>
                                    {/* Thumbnail Image Header */}
                                    {lesson.thumbnail_url && (
                                        <div className="relative h-40 w-full overflow-hidden bg-black/40 border-b border-white/10">
                                            <img
                                                src={lesson.thumbnail_url}
                                                alt={lesson.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80" />
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md">
                                                Module {idx + 1}
                                            </span>

                                            {isCompleted ? (
                                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                                                    <FiCheckCircle size={13} />
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-white/40">
                                                    <FiClock size={12} />
                                                    Incomplete
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                                            {lesson.title}
                                        </h2>
                                        {lesson.description && (
                                            <p className="text-xs text-white/50 mt-2 leading-relaxed line-clamp-2">
                                                {lesson.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="px-6 pb-5 pt-2 flex items-center justify-between text-xs font-semibold text-white/70 group-hover:text-purple-300">
                                    <span>{isCompleted ? "Review Lesson" : "Start Lesson"}</span>
                                    <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}