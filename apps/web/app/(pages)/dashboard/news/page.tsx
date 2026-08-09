import DashboardNavbar from "@/components/custom/dashboard/Navbar";
import { FiRss } from "react-icons/fi";

export default function NewsPage() {
    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />
            <div className="px-4 py-6 md:px-8 lg:px-16">
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <FiRss size={24} className="text-white/40" />
                    </div>
                    <h1 className="text-xl font-extrabold mb-2">Market News</h1>
                    <p className="text-white/40 text-sm max-w-sm">
                        Real-time headlines for your tracked stocks. Coming soon.
                    </p>
                </div>
            </div>
        </div>
    );
}