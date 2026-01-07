"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    AlertTriangle,
    Loader2,
    User,
    Trash2,
} from "lucide-react";
import { deleteAccount, getCurrentUserForSettings } from "./actions";

export default function SettingsPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadUser() {
            const result = await getCurrentUserForSettings();
            if (result.isLoggedIn && result.email) {
                setUserEmail(result.email);
            }
        }
        loadUser();
    }, []);

    const handleDeleteAccount = async () => {
        if (confirmText !== "DELETE") {
            setError("Please type DELETE to confirm");
            return;
        }

        setIsDeleting(true);
        setError(null);

        const result = await deleteAccount();

        if (result.success) {
            router.push("/");
        } else {
            setError(result.error || "Failed to delete account");
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-[100svh] bg-[#2b2b2b] text-[#e6e6e6]">
            <div className="mx-auto max-w-2xl px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/workspaces/${workspaceId}/dashboard`}
                        className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                    <p className="mt-1 text-sm text-white/60">
                        Manage your account preferences
                    </p>
                </div>

                {/* Account Info */}
                <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">
                                {userEmail || "Loading..."}
                            </div>
                            <div className="text-xs text-white/50">Your account email</div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
                    <div className="mb-4 flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Danger Zone</h2>
                    </div>

                    <p className="mb-4 text-sm text-white/70">
                        Once you delete your account, there is no going back. This will
                        permanently delete your account from our authentication system and
                        database. All your data will be lost.
                    </p>

                    {!showConfirmDialog ? (
                        <button
                            onClick={() => setShowConfirmDialog(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                        </button>
                    ) : (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                            <p className="mb-3 text-sm text-white/80">
                                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
                            </p>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="mb-3 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-red-500/50 focus:outline-none"
                                placeholder="Type DELETE"
                                disabled={isDeleting}
                            />
                            {error && (
                                <p className="mb-3 text-sm text-red-400">{error}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Confirm Delete
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmDialog(false);
                                        setConfirmText("");
                                        setError(null);
                                    }}
                                    disabled={isDeleting}
                                    className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
