"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginStart, loginSuccess, loginFailure } from "@store/authSlice";
import { RootState } from "@store/index";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiFetch } from "@utils/api";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!data?.token) throw new Error("Login succeeded but no token returned.");

      const { token, ...userData } = data;
      dispatch(loginSuccess({ user: userData, token }));
      toast.success("Login successful!");
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard animate-fadeIn">
        <div className="authHeader">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center p-3 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="5" height="16" rx="2" />
                <rect x="9.5" y="4" width="5" height="11" rx="2" />
                <rect x="16" y="4" width="5" height="8" rx="2" />
              </svg>
            </div>
          </div>
          <h1>Welcome Back</h1>
          <p>Login to manage your boards and tasks</p>
        </div>

        <form onSubmit={handleLogin} className="authForm">
          <div className="inputGroup">
            <label htmlFor="email">Email Address</label>
            <div className="inputWrapper">
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="inputWrapper__icon" size={18} />
            </div>
          </div>

          <div className="inputGroup">
            <label htmlFor="password">Password</label>
            <div className="inputWrapper">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="inputWrapper__icon" size={18} />
            </div>
          </div>

          <button type="submit" className="authSubmitBtn" disabled={loading}>
            <span>{loading ? "Logging in..." : "Sign In"}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="authFooter">
          <span>Don&apos;t have an account? </span>
          <Link href="/main/auth/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
