"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginStart, loginSuccess, loginFailure } from "@store/authSlice";
import { RootState } from "@store/index";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiFetch } from "../../utils/api";

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

      dispatch(loginSuccess({ user: data, token: data.token as string }));
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
      <div className="authCard">
        <div className="authHeader">
          <h1>Join TaskCorner</h1>
          <p>Organize your work with ease</p>
        </div>

        <form onSubmit={handleSignup} className="authForm">
          <div className="inputGroup">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="authFooter">
          <span>Already have an account? </span>
          <Link href="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}
