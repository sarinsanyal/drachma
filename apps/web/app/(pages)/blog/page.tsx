import { FiEdit3 } from "react-icons/fi";
import Navbar from "@/components/custom/Navbar";

export default function BlogPage() {
    return (
        <div>
            <Navbar />
            <div className="min-h-screen text-white flex flex-col items-center justify-center px-4 py-32 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <FiEdit3 size={24} className="text-white/40" />
                </div>
                <h1 className="text-xl font-extrabold mb-2">Drachma Blog</h1>
                <p className="text-white/40 text-sm max-w-sm">
                    Trading insights, product updates, and market commentary. Coming soon.
                </p>
            </div>
        </div>
    );
}