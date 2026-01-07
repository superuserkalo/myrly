"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle } from "lucide-react";

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const checkoutId = searchParams.get("checkout_id");

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                        <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    Thank you for your purchase!
                </h1>

                <p className="text-gray-400 mb-8">
                    Your payment was successful. You now have access to all the features
                    included in your plan.
                </p>

                {checkoutId && (
                    <p className="text-xs text-gray-500 mb-6">
                        Order ID: <span className="font-mono">{checkoutId}</span>
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold transition hover:opacity-90"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/20 text-white font-semibold transition hover:bg-white/5"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
                </div>
            }
        >
            <CheckoutSuccessContent />
        </Suspense>
    );
}
