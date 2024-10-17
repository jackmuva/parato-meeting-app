import Image from "next/image";
import React from "react";
import LoginForm from "@/app/components/auth-ui/login-form";

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center md:h-screen">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
                    <div className="w-32 text-white md:w-36">
                        <Image
                            className="rounded-xl"
                            src="/llama.png"
                            alt="Llama Logo"
                            width={40}
                            height={40}
                            priority
                        />
                    </div>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}