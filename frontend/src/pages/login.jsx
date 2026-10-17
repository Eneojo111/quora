import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { loginUser } from "../services/authService";

export default function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginUser(email, password);

            if (!result?.user) {
                throw new Error("Login succeeded, but no user information was returned.");
            }

            onLogin(result.user);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="ql-page">
            <section className="ql-card">
                <header className="ql-header">
                    <h1 className="ql-logo">Quora</h1>
                    <p className="ql-tagline">
                        A place to share knowledge and better understand the world
                    </p>
                </header>

                <div className="ql-body">
                    {/* LEFT COLUMN */}
                    <div className="ql-left">
                        <p className="ql-terms">
                            By continuing you indicate that you agree to Quora’s{" "}
                            <span className="ql-terms-link">Terms of Service</span> and{" "}
                            <span className="ql-terms-link">Privacy Policy</span>.
                        </p>

                        <button
                            type="button"
                            className="ql-social"
                            title="Coming soon"
                            aria-disabled="true"
                        >
                            <FcGoogle className="ql-social-icon" />
                            <span>Continue with Google</span>
                        </button>

                        <button
                            type="button"
                            className="ql-social"
                            title="Coming soon"
                            aria-disabled="true"
                        >
                            <FaFacebook className="ql-social-icon ql-facebook" />
                            <span>Continue with Facebook</span>
                        </button>

                        <button
                            type="button"
                            className="ql-email-signup"
                            onClick={onSwitchToRegister}
                        >
                            Sign up with email
                        </button>
                    </div>

                    {/* RIGHT COLUMN */}
                    <form className="ql-right" onSubmit={handleSubmit}>
                        <h2 className="ql-form-title">Login</h2>

                        <div className="ql-field">
                            <label htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Your email"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="ql-field">
                            <div className="ql-label-row">
                                <label htmlFor="login-password">Password</label>
                                <button
                                    type="button"
                                    className="ql-show"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? "Hide password" : "Show password"}
                                </button>
                            </div>
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Your password"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error && (
                            <p className="ql-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="ql-actions">
                            <span className="ql-forgot" title="Coming soon">
                                Forgot password?
                            </span>

                            <button
                                type="submit"
                                className="ql-submit"
                                disabled={loading || !email || !password}
                            >
                                {loading ? "Signing in..." : "Login"}
                            </button>
                        </div>
                    </form>
                </div>

                <footer className="ql-footer">
                    About · Careers · Privacy · Terms · Contact · Languages · Your Ad
                    Choices · Press · © Quora, Inc. {new Date().getFullYear()}
                </footer>
            </section>
        </main>
    );
}

