import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const OPEN_TO_WORK = true;
const SHOW_DEMOS = true;

const TERM_LINES = [
  { prefix: "$", color: "var(--color-neutral-200)", text: "whoami" },
  {
    prefix: "",
    color: "var(--color-neutral-500)",
    text: "khawarizmi · full-stack software engineer · kuala lumpur",
  },
  { prefix: "$", color: "var(--color-neutral-200)", text: "go run ./cmd/server" },
  {
    prefix: "✓",
    color: "var(--color-accent-300)",
    text: "api up on :8080 (12ms cold start)",
  },
  { prefix: "$", color: "var(--color-neutral-200)", text: "pnpm dev" },
  {
    prefix: "✓",
    color: "var(--color-accent-300)",
    text: "ui ready in 312ms, hot reload on",
  },
  { prefix: "$", color: "var(--color-neutral-200)", text: "git push origin main" },
  {
    prefix: "✓",
    color: "var(--color-accent-300)",
    text: "deployed. both ends, one engineer.",
  },
];

function useTerminalLines() {
  const total = useMemo(
    () => TERM_LINES.reduce((a, l) => a + l.text.length, 0),
    [],
  );
  const [n, setN] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setN((prev) => {
        const next = Math.min(total, prev + 2);
        if (next >= total) clearInterval(timer);
        return next;
      });
    }, 26);
    return () => clearInterval(timer);
  }, [total]);

  let left = n;
  const lines: { prefix: string; color: string; text: string; cursor: boolean }[] =
    [];
  for (const line of TERM_LINES) {
    if (left <= 0) break;
    lines.push({ ...line, text: line.text.slice(0, left), cursor: false });
    left -= line.text.length;
  }
  if (lines.length) lines[lines.length - 1].cursor = true;
  return lines;
}

function useReveal() {
  const elsRef = useRef<Set<HTMLElement>>(new Set());
  const register = useCallback((el: HTMLElement | null) => {
    if (el) elsRef.current.add(el);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const el = e.target as HTMLElement;
              el.style.opacity = "1";
              el.style.transform = "none";
              io.unobserve(el);
            }
          });
        },
        { threshold: 0.1 },
      );
      elsRef.current.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(26px)";
        el.style.transition =
          "opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)";
        io.observe(el);
      });
      return () => io.disconnect();
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return register;
}

function App(): React.ReactElement {
  const term = useTerminalLines();
  const reveal = useReveal();

  return (
    <div
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        minHeight: "100vh",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "color-mix(in srgb, var(--color-bg) 82%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid color-mix(in srgb, var(--color-text) 7%, transparent)",
        }}
      >
        <div className="nav" style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 32px" }}>
          <a
            href="#home"
            className="nav-brand"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "inherit", textDecoration: "none" }}
          >
            <img src="/mark-framed.svg" alt="Khawarizmi Jefri" style={{ width: 28, height: 28, display: "block" }} />
            <span style={{ fontSize: 15 }}>Khawarizmi Jefri</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#work">Work</a>
            <a href="#stack">Stack</a>
            <a href="#freelance">Freelance</a>
            <a href="#about">About</a>
            <a
              className="btn btn-primary"
              href="mailto:khawarizmijefri02@gmail.com?subject=Project%20inquiry"
              style={{ fontSize: 13, padding: "6px 14px" }}
            >
              Email me
            </a>
          </div>
        </div>
      </nav>

      <section id="home" style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(720px 420px at 78% -10%, color-mix(in srgb, var(--color-accent) 9%, transparent), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "88px 32px 72px",
            position: "relative",
            display: "grid",
            gridTemplateColumns: "minmax(320px, 1.1fr) minmax(300px, 0.9fr)",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}>
            {OPEN_TO_WORK && (
              <span className="tag tag-outline" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px" }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    animation: "kj-pulse 2.4s ease infinite",
                  }}
                />
                Open for freelance work · Kuala Lumpur
              </span>
            )}
            <h1
              style={{
                fontSize: "clamp(42px, 5.4vw, 68px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                margin: 0,
                fontWeight: 500,
                textWrap: "balance",
              }}
            >
              Backends that hold up. <span style={{ color: "var(--color-accent-300)" }}>Frontends that feel alive.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--color-neutral-400)", maxWidth: "52ch", margin: 0 }}>
              Hi, I'm Khawarizmi, a full-stack software engineer. I design, build, and ship complete web applications: Go
              and PostgreSQL under the hood, React and TypeScript up front. Yes, both halves.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
              <a
                className="btn btn-primary"
                href="mailto:khawarizmijefri02@gmail.com?subject=Let%27s%20build%20something"
                style={{ padding: "10px 20px", fontSize: 15 }}
              >
                Let's talk about your project <i className="ph ph-arrow-right" />
              </a>
              <a className="btn btn-secondary" href="#work" style={{ padding: "10px 20px", fontSize: 15 }}>
                See my work
              </a>
            </div>
            <div style={{ width: "100%", marginTop: 24 }}>
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(to right, transparent, var(--color-divider) 48px, var(--color-divider) calc(100% - 48px), transparent)",
                  marginBottom: 20,
                }}
              />
              <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 26, fontFamily: "var(--font-heading)", fontWeight: 500, color: "var(--color-accent-300)" }}>
                    1+
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>years shipping web apps</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 26, fontFamily: "var(--font-heading)", fontWeight: 500, color: "var(--color-accent-300)" }}>
                    3
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>client demo sites live</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 26, fontFamily: "var(--font-heading)", fontWeight: 500, color: "var(--color-accent-300)" }}>
                    ×1
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>engineer, end to end</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: -24,
                background:
                  "radial-gradient(60% 60% at 50% 50%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 75%)",
                filter: "blur(10px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "relative",
                background: "var(--color-neutral-900)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-md)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 16px",
                  borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-neutral-700)" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-neutral-700)" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-neutral-700)" }} />
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 11,
                    color: "var(--color-neutral-600)",
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  }}
                >
                  khawarizmi@dev ~ zsh
                </span>
              </div>
              <div
                style={{
                  padding: "18px 20px 22px",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  fontSize: 13,
                  lineHeight: 1.7,
                  minHeight: 236,
                }}
              >
                {term.map((ln, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ color: "var(--color-accent)", flex: "none", width: 14 }}>{ln.prefix}</span>
                    <span style={{ color: ln.color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {ln.text}
                      {ln.cursor && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 14,
                            background: "var(--color-accent)",
                            marginLeft: 2,
                            verticalAlign: -2,
                            animation: "kj-blink 1s steps(1) infinite",
                          }}
                        />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="work" style={{ padding: "88px 0 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
          <div
            ref={reveal}
            style={{ marginBottom: 48, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}
          >
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
              01 / Work
            </span>
            <h2 style={{ fontSize: "clamp(30px, 3.6vw, 44px)", margin: 0, letterSpacing: "-0.015em" }}>Things I've built</h2>
            <p style={{ color: "var(--color-neutral-500)", margin: 0, fontSize: 15 }}>
              Real projects, both ends of the stack.
            </p>
          </div>

          <div
            ref={reveal}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(320px, 1.15fr) minmax(280px, 0.85fr)",
              gap: 40,
              alignItems: "center",
              marginBottom: 56,
            }}
          >
            <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)", aspectRatio: "16 / 10" }}>
              <img
                src="/clover.png"
                alt="Clover access-control web app, welcome screen"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
                Featured · Access control
              </span>
              <h3 style={{ fontSize: 30, margin: 0 }}>Clover</h3>
              <p style={{ color: "var(--color-neutral-400)", lineHeight: 1.65, margin: 0 }}>
                A cloud-based access control system that manages who can reach what. Roles, permissions, and access flows
                handled server-side in Go, with a hand-built HTML, JS, and CSS front end. No framework training wheels.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="tag tag-accent">Go</span>
                <span className="tag tag-neutral">PostgreSQL</span>
                <span className="tag tag-neutral">HTML · JS · CSS</span>
              </div>
            </div>
          </div>

          <div
            ref={reveal}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}
          >
            <div className="card elev-sm" style={{ padding: 0, overflow: "hidden", gap: 0 }}>
              <div style={{ aspectRatio: "16 / 9" }}>
                <img
                  src="/portal.png"
                  alt="CS One Stop Portal landing screen"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20, alignItems: "flex-start" }}>
                <span className="card-kicker">Community platform</span>
                <h4 style={{ margin: 0, fontSize: 20 }}>CS One Stop Portal</h4>
                <p style={{ color: "var(--color-neutral-400)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  A portal for the CS community to share, study, and collaborate on projects together: one place instead
                  of five group chats.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="tag tag-accent">Next.js</span>
                  <span className="tag tag-neutral">TypeScript</span>
                  <span className="tag tag-neutral">React</span>
                </div>
              </div>
            </div>
            <div className="card elev-sm" style={{ padding: 0, overflow: "hidden", gap: 0 }}>
              <div
                style={{
                  aspectRatio: "16 / 9",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  overflow: "hidden",
                  background:
                    "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%), color-mix(in srgb, var(--color-text) 5%, transparent)",
                }}
              >
                <img
                  src="/gethealthy.png"
                  alt="Get Healthy workout app, today's plan"
                  style={{
                    width: "47%",
                    minWidth: 130,
                    marginTop: 26,
                    borderRadius: "14px 14px 0 0",
                    boxShadow: "var(--shadow-md)",
                    display: "block",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20, alignItems: "flex-start" }}>
                <span className="card-kicker">Mobile</span>
                <h4 style={{ margin: 0, fontSize: 20 }}>Get Healthy</h4>
                <p style={{ color: "var(--color-neutral-400)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  A personal workout-planning app: simple and deliberate, built to make training a habit rather than a
                  resolution.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="tag tag-accent">React Native</span>
                  <span className="tag tag-outline">In development</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stack" style={{ padding: "88px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
          <div
            ref={reveal}
            style={{ marginBottom: 48, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}
          >
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
              02 / Stack
            </span>
            <h2 style={{ fontSize: "clamp(30px, 3.6vw, 44px)", margin: 0, letterSpacing: "-0.015em" }}>
              One person, both halves
            </h2>
            <p style={{ color: "var(--color-neutral-500)", margin: 0, fontSize: 15, maxWidth: "56ch" }}>
              The point isn't the list. It's that the same engineer carries a feature from schema to screen.
            </p>
          </div>
          <div ref={reveal} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h6 style={{ color: "var(--color-neutral-500)", margin: "0 0 14px" }}>Up front</h6>
              {[
                { icon: "ph-atom", name: "React", desc: "interfaces that respond like apps, not pages" },
                { icon: "ph-brackets-angle", name: "TypeScript", desc: "typed all the way to the edge" },
                { icon: "ph-cursor-click", name: "UI/UX & CSS", desc: "motion, layout, and the details people feel" },
              ].map((row) => (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    alignItems: "baseline",
                    background:
                      "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-text) 8%, transparent) 48px, color-mix(in srgb, var(--color-text) 8%, transparent) calc(100% - 48px), transparent) no-repeat bottom / 100% 1px",
                  }}
                >
                  <i className={`ph ${row.icon}`} style={{ color: "var(--color-accent)", fontSize: 20, flex: "none" }} />
                  <div>
                    <span style={{ fontSize: 16 }}>{row.name}</span>
                    <span style={{ color: "var(--color-neutral-500)", fontSize: 13 }}>: {row.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h6 style={{ color: "var(--color-neutral-500)", margin: "0 0 14px" }}>Under the hood</h6>
              {[
                { icon: "ph-lightning", name: "Go", desc: "small, fast services that stay up" },
                { icon: "ph-database", name: "PostgreSQL", desc: "schemas built for the queries you'll actually run" },
                {
                  icon: "ph-shipping-container",
                  name: "Docker & Kubernetes",
                  desc: 'packaged and deployed, not "works on my machine"',
                },
              ].map((row) => (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    alignItems: "baseline",
                    background:
                      "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-text) 8%, transparent) 48px, color-mix(in srgb, var(--color-text) 8%, transparent) calc(100% - 48px), transparent) no-repeat bottom / 100% 1px",
                  }}
                >
                  <i className={`ph ${row.icon}`} style={{ color: "var(--color-accent)", fontSize: 20, flex: "none" }} />
                  <div>
                    <span style={{ fontSize: 16 }}>{row.name}</span>
                    <span style={{ color: "var(--color-neutral-500)", fontSize: 13 }}>: {row.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="freelance"
        style={{
          background:
            "radial-gradient(900px 420px at 18% 0%, var(--color-section-glow), transparent 70%), var(--color-section)",
          padding: "88px 0",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
          <div
            ref={reveal}
            style={{ marginBottom: 48, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}
          >
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>
              03 / Freelance
            </span>
            <h2 style={{ fontSize: "clamp(30px, 3.6vw, 44px)", margin: 0, letterSpacing: "-0.015em", textWrap: "balance" }}>
              I also build web apps for clients
            </h2>
            <p style={{ color: "var(--color-neutral-300)", margin: 0, fontSize: 16, maxWidth: "58ch" }}>
              Freelance, end to end, fast. You bring the problem, I bring the whole stack, from the first call to the
              deployed app.
            </p>
          </div>
          <div
            ref={reveal}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 56 }}
          >
            {[
              { n: "01", title: "Scope", desc: "A short call. You explain the problem in plain words; I turn it into a plan with a real timeline." },
              { n: "02", title: "Design", desc: "You see clickable UI early, so we adjust before a single line of backend is written." },
              { n: "03", title: "Build", desc: "Weekly check-ins with something running. No month-long silences." },
              { n: "04", title: "Ship", desc: "Deployed, documented, handed over, and I stick around for fixes." },
            ].map((step) => (
              <div
                key={step.n}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 20,
                  borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, var(--color-bg) 38%, transparent)",
                }}
              >
                <span style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 13, color: "var(--color-accent-300)" }}>
                  {step.n}
                </span>
                <span style={{ fontSize: 16, fontFamily: "var(--font-heading)", fontWeight: 500 }}>{step.title}</span>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-300)", margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          {SHOW_DEMOS && (
            <div ref={reveal} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h6 style={{ color: "var(--color-neutral-300)", margin: 0 }}>Demo sites I've shipped, all live</h6>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                {[
                  { href: "https://barber-demo.khawarizmi.space/", img: "/barber.PNG", alt: "Barbershop demo site", label: "Barbershop booking" },
                  { href: "https://cafe-demo.khawarizmi.space/", img: "/cafe.PNG", alt: "Café demo site", label: "Café menu & ordering" },
                  { href: "https://tuition-demo.khawarizmi.space/", img: "/tuition.PNG", alt: "Tuition center demo site", label: "Tuition center platform" },
                ].map((demo) => (
                  <a
                    key={demo.href}
                    href={demo.href}
                    target="_blank"
                    rel="noopener"
                    className="kj-demo-card"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      background: "color-mix(in srgb, var(--color-bg) 38%, transparent)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <img
                      src={demo.img}
                      alt={demo.alt}
                      style={{ aspectRatio: "16 / 10", objectFit: "cover", objectPosition: "top", width: "100%" }}
                    />
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", fontSize: 14 }}>
                      {demo.label} <i className="ph ph-arrow-up-right" style={{ color: "var(--color-accent-300)" }} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div ref={reveal} style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 48 }}>
            <a
              className="btn btn-primary"
              href="mailto:khawarizmijefri02@gmail.com?subject=Project%20inquiry"
              style={{ padding: "10px 20px", fontSize: 15 }}
            >
              Email me about your project <i className="ph ph-paper-plane-tilt" />
            </a>
            <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>Usually replies within a day.</span>
          </div>
        </div>
      </section>

      <section id="about" style={{ padding: "88px 0" }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 32px",
            display: "grid",
            gridTemplateColumns: "minmax(240px, 0.7fr) minmax(320px, 1.3fr)",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div
            ref={reveal}
            style={{
              position: "relative",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
              aspectRatio: "4 / 5",
              border: "1px solid color-mix(in srgb, var(--color-text) 10%, transparent)",
            }}
          >
            <img
              src="/portrait-steps.png"
              alt="Khawarizmi Jefri"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 28%", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 55%, transparent) 18%, transparent 52%), radial-gradient(120% 80% at 50% 30%, transparent 45%, color-mix(in srgb, var(--color-bg) 70%, transparent) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
          <div ref={reveal} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
              04 / About
            </span>
            <h2 style={{ fontSize: "clamp(30px, 3.6vw, 44px)", margin: 0, letterSpacing: "-0.015em" }}>A bit about me</h2>
            <p style={{ color: "var(--color-neutral-400)", lineHeight: 1.7, margin: 0, maxWidth: "58ch" }}>
              I studied software engineering at Universiti Sains Malaysia and have been building for the web for over a
              year, long enough to have shipped real things, recent enough to still be excited about all of it. What
              actually gets me going is interactive UI: the moment a screen stops being a page and starts feeling like
              something you're holding.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "10px 24px", fontSize: 14, marginTop: 8 }}>
              <span style={{ color: "var(--color-neutral-500)" }}>Based in</span>
              <span>Kuala Lumpur, Malaysia</span>
              <span style={{ color: "var(--color-neutral-500)" }}>Education</span>
              <span>Software Engineering, USM</span>
              <span style={{ color: "var(--color-neutral-500)" }}>Sweet spot</span>
              <span>Interactive UI · end-to-end builds</span>
              {OPEN_TO_WORK && (
                <>
                  <span style={{ color: "var(--color-neutral-500)" }}>Availability</span>
                  <span style={{ color: "var(--color-accent-300)" }}>Open for freelance work</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" style={{ padding: "88px 0 48px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 40 }}>
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to right, transparent, var(--color-divider) 48px, var(--color-divider) calc(100% - 48px), transparent)",
            }}
          />
          <div ref={reveal} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, letterSpacing: "-0.02em" }}>Let's build something.</h2>
            <a
              href="mailto:khawarizmijefri02@gmail.com"
              style={{ fontSize: "clamp(18px, 2.4vw, 26px)", textDecoration: "none", borderBottom: "1px solid var(--color-accent)" }}
            >
              khawarizmijefri02@gmail.com
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <a
                href="https://github.com/khawarizmi02"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                className="kj-social-link"
                style={{ color: "var(--color-neutral-400)", fontSize: 22, display: "inline-flex" }}
              >
                <i className="ph ph-github-logo" />
              </a>
              <a
                href="https://www.linkedin.com/in/khawarizmi-jefri/"
                target="_blank"
                rel="noopener"
                aria-label="LinkedIn"
                className="kj-social-link"
                style={{ color: "var(--color-neutral-400)", fontSize: 22, display: "inline-flex" }}
              >
                <i className="ph ph-linkedin-logo" />
              </a>
              <a
                href="mailto:khawarizmijefri02@gmail.com"
                aria-label="Email"
                className="kj-social-link"
                style={{ color: "var(--color-neutral-400)", fontSize: 22, display: "inline-flex" }}
              >
                <i className="ph ph-envelope-simple" />
              </a>
            </div>
            <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>© 2026 Khawarizmi Jefri · Kuala Lumpur</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
