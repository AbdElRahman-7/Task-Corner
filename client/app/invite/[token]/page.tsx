"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/index";
import { apiFetch } from "../../../utils/api";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { loadState } from "../../../store/localStorage";
import styles from "./invite.module.scss";

export default function InvitePage() {
  const pathname = usePathname();
  const tokenFromPath = (() => {
    const last = pathname?.split("/").filter(Boolean).pop();
    if (!last || last === "invite") return undefined;
    return last;
  })();
  const token = tokenFromPath;
  const router = useRouter();
  const authTokenFromRedux = useSelector((state: RootState) => state.auth.token);
  const authToken = authTokenFromRedux ?? loadState()?.auth?.token ?? null;
  
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{ email?: string } | null>(null);
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
      toast.error("Please log in or sign up to accept this invitation.");
      router.push("/login");
      return;
    }

    try {
      const response = await apiFetch(`/invite/${token}/accept`, {
        method: "POST",
        token: authToken,
        auth: true,
      });
      
      toast.success(response.message || "Successfully joined!");
      router.push(`/board/${response.boardId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite.");
    }
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
        <p className={styles.loadingText}>Loading invitation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.titleError}>Oops!</h2>
          <p className={`${styles.muted} ${styles.mb2}`}>{error}</p>
          <button onClick={() => router.push('/')} className={styles.homeBtn}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.cardLarge}`}>
        <div className={styles.icon}>
          💌
        </div>
        <h1 className={styles.title}>You&apos;ve been invited!</h1>
        <p className={styles.description}>
          You have been invited to collaborate on a workspace.
          <br/><br/>
          Invitation intended for:<br/>
          <strong className={styles.email}>{invite?.email}</strong>
        </p>
        
        {!authToken && (
          <div className={styles.hintBox}>
            <p className={styles.hintText}>
              To accept, please log in or create an account with the exact email address shown above.
            </p>
          </div>
        )}

        <button 
          onClick={handleAccept}
          className={styles.acceptBtn}
        >
          {authToken ? "Accept Invitation" : "Log In to Accept"}
        </button>
      </div>
    </div>
  );
}
