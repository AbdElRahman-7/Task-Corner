"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginStart, loginSuccess, loginFailure } from "@store/authSlice";
import { RootState } from "@store/index";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiFetch } from "../../utils/api";

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

      dispatch(loginSuccess({ user: data, token: data.token as string }));
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
          <h1>Welcome Back</h1>
          <p>Login to manage your boards and tasks</p>
        </div>
        
        <form onSubmit={handleLogin} className="authForm">
          <div className="inputGroup">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="inputGroup">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="authSubmitBtn" disabled={loading}>
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>
        
        <div className="authFooter">
          <span>Don&apos;t have an account? </span>
          <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
