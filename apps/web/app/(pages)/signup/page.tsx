"use client";

import Navbar from "@/components/custom/Navbar";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterOAuthOnly() {
    return (
        <div>
            <Toaster />
            <Navbar />
            <div className="flex h-[calc(100vh-10px)] items-center justify-center px-4 md:px-8 lg:px-16 bg-transparent text-white">
                <div className="hidden lg:flex flex-col text-center justify-center pt-12 pb-12 w-1/2">
                    <h1 className="text-5xl font-extrabold mb-4">From the chaos of the market to the calm of mastery,</h1>
                    <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500">
                        Conquer Drachma and rewrite your financial fate.
                    </h1>
                </div>

                <div className="w-full sm:w-96 lg:w-1/2 flex justify-center">
                    <Card className="w-full max-w-md shadow-md backdrop-blur-3xl bg-transparent/50 text-white">
                        <CardHeader>
                            <CardTitle className="text-center text-2xl font-bold">Signup for Drachma</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 mt-6">
                                <Button
                                    variant="outline"
                                    className="w-full flex items-center text-black gap-2 justify-center cursor-pointer"
                                    onClick={() => toast("Google OAuth coming soon...")}
                                >
                                    <FcGoogle className="text-xl" />
                                    Continue with Google
                                </Button>
                                <Button
                                    variant="default"
                                    className="w-full flex items-center bg-black text-white gap-2 justify-center cursor-pointer"
                                    onClick={() => toast("GitHub OAuth coming soon...")}
                                >
                                    <FaGithub className="text-xl" />
                                    Continue with GitHub
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}