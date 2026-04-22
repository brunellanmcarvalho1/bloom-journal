import {
  BookHeart,
  CalendarDays,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/write", label: "Write Today", icon: BookHeart },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

function AppShell() {
  const { logout, user } = useAuth();

  return (
    <div className="bloom-page min-h-screen px-4 py-6 md:px-8 lg:px-10">
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <header className="flex items-center justify-end px-1 lg:col-start-2">
          <button
            type="button"
            onClick={logout}
            aria-label={`Log out ${user?.name || "User"}`}
            className="flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-left shadow-[0_12px_30px_rgba(219,112,151,0.08)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-blush-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blush-100 text-rose-700">
              <LogOut size={16} />
            </span>
            <span className="text-sm font-bold text-plum-900">
              {user?.name || "User"}
            </span>
          </button>
        </header>

        <aside className="glass-panel rounded-[2rem] border border-white/70 p-5 lg:row-start-2 lg:p-6">
          <div className="rounded-[1.75rem] bg-linear-to-br from-blush-100 via-peach-100 to-lilac-100 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-700/80">
              Bloom Journal
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none text-plum-900">
              Bloom with every entry
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-700">
              Your soft little corner to write in English, improve gently, and
              track your progress day by day.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navigation.map((item) => {
              const NavigationIcon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                      isActive
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                        : "bg-white/55 text-ink-700 hover:bg-white",
                    ].join(" ")
                  }
                >
                  <NavigationIcon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 lg:col-start-2 lg:row-start-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { AppShell };
