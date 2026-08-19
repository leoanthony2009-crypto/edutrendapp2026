import { lazy, Suspense, useState } from "react";
import { Home, TrendingUp, Flower2, Zap, CircleUser } from "lucide-react";
import { useStore } from "./lib/store";
import type { Role, Screen } from "./types";
import { ROLE_CHIPS, SCHOOL_NAME } from "./data/insights";
import { BloomLogo } from "./components/BloomLogo";
import { Splash } from "./components/Splash";
import { TodayStudent } from "./screens/TodayStudent";
import { TodayTeacher } from "./screens/TodayTeacher";
import { TodayLeader } from "./screens/TodayLeader";
import { Pulse } from "./screens/Pulse";
import { WhatsHot } from "./screens/WhatsHot";
import { Manage } from "./screens/Manage";
import { Builder } from "./screens/Builder";
import { Profile } from "./screens/Profile";
import { TellALeaderSheet } from "./screens/TellALeader";

// Recharts is the heaviest dependency — load Trends on demand so the first
// paint stays light on low-bandwidth connections (spec §"two-minute contract").
const Trends = lazy(() => import("./screens/Trends").then((m) => ({ default: m.Trends })));

const NAV: Array<{ key: Screen; label: string; Icon: typeof Home }> = [
  { key: "today", label: "Today", Icon: Home },
  { key: "trends", label: "Trends", Icon: TrendingUp },
  { key: "pulse", label: "Pulse", Icon: Flower2 },
  { key: "hot", label: "What's Hot", Icon: Zap },
  { key: "profile", label: "Profile", Icon: CircleUser },
];

const NEXT_ROLE: Record<Role, Role> = { student: "teacher", teacher: "leader", leader: "student" };

export default function App() {
  const { state, dispatch } = useStore();
  const [screen, setScreen] = useState<Screen>("today");
  const [tellOpen, setTellOpen] = useState(false);

  const role = state.role;
  const activeKey: Screen = screen === "manage" ? "pulse" : screen === "builder" ? "today" : screen;

  // Demo affordance: real roles come from auth (DESIGN_REVIEW.md P1-7); the
  // chip is the context indicator/switcher until that backend exists.
  const cycleRole = () => {
    const nr = NEXT_ROLE[role];
    dispatch({ type: "setRole", role: nr });
    if (nr === "student" && (screen === "manage" || screen === "builder")) setScreen("today");
  };

  const go = (s: Screen) => setScreen(s);

  const today = (() => {
    if (role === "student") return <TodayStudent go={go} />;
    if (role === "teacher") return <TodayTeacher go={go} onTell={() => setTellOpen(true)} />;
    return <TodayLeader go={go} />;
  })();

  return (
    <div className="flex min-h-screen justify-center py-0 sm:py-7">
      <div className="relative flex w-full max-w-[400px] flex-col overflow-hidden bg-cream text-ink sm:h-[830px] sm:rounded-shell sm:border sm:border-border-strong sm:shadow-shell md:max-w-[960px]">
        {!state.firstLaunchDone && <Splash onDone={() => dispatch({ type: "splashDone" })} />}

        <div className="flex min-h-0 flex-1 md:flex-row">
          {/* Side rail ≥768px per README § Navigation */}
          <nav aria-label="Main" className="hidden w-48 flex-none flex-col gap-1 border-r border-border-soft p-4 pt-6 md:flex">
            <div className="mb-5 flex items-center gap-2 px-2">
              <BloomLogo size={30} />
              <div>
                <div className="font-display text-base font-extrabold leading-none text-green">Bloom</div>
                <div className="mt-0.5 text-[10px] text-meta">{SCHOOL_NAME}</div>
              </div>
            </div>
            {NAV.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => go(key)}
                aria-current={activeKey === key ? "page" : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-row px-3 text-[13px] ${
                  activeKey === key ? "bg-cream-dim font-extrabold text-green" : "font-semibold text-nav-idle hover:text-ink"
                }`}
              >
                <Icon size={18} strokeWidth={activeKey === key ? 2.6 : 2} aria-hidden />
                {label}
              </button>
            ))}
            <button
              onClick={cycleRole}
              title="Demo: switch role context"
              className="mt-auto rounded-full bg-[#EFE7D2] px-3 py-2.5 text-[10.5px] font-bold text-gold-ink"
            >
              {ROLE_CHIPS[role]} ⇅
            </button>
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Mobile header */}
            <header className="flex flex-none items-center gap-2.5 px-4 pt-4 md:hidden">
              <BloomLogo size={28} />
              <div>
                <h1 className="font-display text-base font-extrabold leading-none text-green">Bloom</h1>
                <div className="mt-0.5 text-[10px] text-meta">{SCHOOL_NAME}</div>
              </div>
              <button
                onClick={cycleRole}
                title="Demo: switch role context"
                className="ml-auto min-h-[34px] rounded-full bg-[#EFE7D2] px-3 py-1.5 text-[10.5px] font-bold text-gold-ink"
              >
                {ROLE_CHIPS[role]} ⇅
              </button>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto pb-2">
              {screen === "today" && today}
              {screen === "pulse" && <Pulse go={go} />}
              {screen === "trends" && (
                <Suspense
                  fallback={
                    <p className="px-4 pt-6 text-sm text-meta" role="status">
                      Loading trends…
                    </p>
                  }
                >
                  <Trends />
                </Suspense>
              )}
              {screen === "hot" && <WhatsHot />}
              {screen === "profile" && <Profile go={go} />}
              {screen === "manage" && <Manage go={go} />}
              {screen === "builder" && <Builder go={go} />}
            </main>

            {/* Bottom bar <768px */}
            <nav
              aria-label="Main"
              className="flex flex-none items-center justify-around border-t border-border-soft bg-cream px-2 pb-3.5 pt-2 md:hidden"
            >
              {NAV.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => go(key)}
                  aria-current={activeKey === key ? "page" : undefined}
                  className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 ${
                    activeKey === key ? "text-green" : "text-nav-idle"
                  }`}
                >
                  <Icon size={19} strokeWidth={activeKey === key ? 2.6 : 2} aria-hidden />
                  <span className={`text-[9.5px] ${activeKey === key ? "font-extrabold" : "font-semibold"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {tellOpen && <TellALeaderSheet onClose={() => setTellOpen(false)} />}
      </div>
    </div>
  );
}
