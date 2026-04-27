"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginStart, loginSuccess, loginFailure } from "@store/authSlice";
import { RootState } from "@store/index";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiFetch } from "@utils/api";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleSignup = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      if (!data?.token) throw new Error("Signup succeeded but no token returned.");

      const { token, ...userData } = data;
      dispatch(loginSuccess({ user: userData, token }));
      toast.success("Account created successfully!");
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
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
          <h1>Join TaskCorner</h1>
          <p>Organize your work with ease</p>
        </div>

        <form onSubmit={handleSignup} className="authForm">
          <div className="inputGroup">
            <label htmlFor="username">Username</label>
            <div className="inputWrapper">
              <input
                id="username"
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User className="inputWrapper__icon" size={18} />
            </div>
          </div>

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
            <span>{loading ? "Creating Account..." : "Sign Up"}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="authFooter">
          <span>Already have an account? </span>
          <Link href="/main/auth/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}
