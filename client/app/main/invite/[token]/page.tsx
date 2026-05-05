"use client";
import { use, useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { apiFetch } from "@utils/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { loadState } from "@store/localStorage";
import styles from "./invite.module.scss";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const authTokenFromRedux = useSelector((state: RootState) => state.auth.token);
  const authToken = authTokenFromRedux ?? loadState()?.auth?.token ?? null;

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{ email?: string, name?: string, boardId?: string, workspaceId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch(`/invite/${token}`)
      .then((data) => {
        setInvite(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired invite.");
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) {
      toast.error("Invalid invite link.");
      router.push("/");
      return;
    }
    if (!authToken) {
      const returnUrl = encodeURIComponent(`${window.location.pathname}`);
      router.push(`/main/auth/login?redirect=${returnUrl}&email=${encodeURIComponent(invite?.email || "")}`);
      return;
    }

    try {
      const response = await apiFetch(`/invite/${token}/accept`, {
        method: "POST",
        token: authToken,
        auth: true,
      });

      toast.success(response.message || "Successfully joined!");
      const redirectPath = response.type === 'workspace' ? '/' : `/main/board/${response.id}`;
      router.push(redirectPath);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite.");
    }
  };

  const handleAuthRedirect = (type: 'login' | 'signup') => {
    const returnUrl = encodeURIComponent(`${window.location.pathname}`);
    router.push(`/main/auth/${type}?redirect=${returnUrl}&email=${encodeURIComponent(invite?.email || "")}`);
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.titleError}>Oops!</h2>
          <p className={`${styles.muted} ${styles.mb2}`}>Invalid invite link.</p>
          <button onClick={() => router.push('/')} className={styles.homeBtn}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
          <p className={styles.loadingText}>Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
             <span className="text-4xl">⚠️</span>
          </div>
          <h2 className={styles.titleError}>Invitation Expired</h2>
          <p className={`${styles.muted} ${styles.mb6}`}>This invitation link is either invalid or has expired. Please ask the administrator for a new one.</p>
          <button onClick={() => router.push('/')} className={styles.homeBtn}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const targetName = (invite?.boardId as any)?.title || "a Board";
  const inviteType = invite?.workspaceId ? "workspace" : "board";

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.cardLarge} animate-fadeIn`}>
        <div className="mb-8">
           <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[28px] shadow-2xl shadow-violet-500/20 flex items-center justify-center text-4xl mb-6 mx-auto transform -rotate-3 hover:rotate-0 transition-transform duration-500">
             💌
           </div>
        </div>

        <h1 className={styles.title}>
          {invite?.name ? `Hey ${invite.name},` : "You're Invited!"}
          <span className="block text-violet-600 mt-1">Join {targetName}</span>
        </h1>

        <p className={styles.description}>
          You have been invited to collaborate on <strong>{targetName}</strong> as a <strong>{invite?.role || 'viewer'}</strong>.
          <br /><br />
          <span className="opacity-60">Invitation for:</span><br />
          <strong className={styles.email}>{invite?.email}</strong>
        </p>

        {!authToken ? (
          <div className="mt-8 space-y-4">
            <div className={styles.hintBox}>
              <p className={styles.hintText}>
                To accept, please log in or create a new account with the email address above.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAuthRedirect('login')}
                className="btnSecondary !py-4 !rounded-2xl !text-sm !font-bold"
              >
                Log In
              </button>
              <button
                onClick={() => handleAuthRedirect('signup')}
                className="btnPrimary !py-4 !rounded-2xl !text-sm !font-black !bg-violet-600"
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <button
              onClick={handleAccept}
              className={styles.acceptBtn}
            >
              Accept Invitation & Join
            </button>
          </div>
        )}
        
        <p className="mt-8 text-[11px] text-gray-400 font-medium uppercase tracking-widest">
          Powered by TaskCorner
        </p>
      </div>
    </div>
  );
}