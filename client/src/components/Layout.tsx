import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";

interface NavItem {
  to: string;
  label: string;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { to: "/", label: "Inicio", roles: ["admin", "encargado"] },
  { to: "/conteo", label: "Conteo", roles: ["admin", "encargado"] },
  { to: "/recepcion", label: "Recepción", roles: ["admin", "encargado"] },
  { to: "/surtido", label: "Surtido", roles: ["admin", "encargado"] },
  { to: "/reportes", label: "Reportes", roles: ["admin", "encargado"] },
  { to: "/capacitaciones", label: "Capacitaciones", roles: ["admin", "encargado", "trabajador"] },
  { to: "/admin/capacitaciones", label: "Editar capacit.", roles: ["admin"] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-pittacos-700">🌮 PitTacos</h1>
            <p className="text-xs text-gray-500">
              {user.name}
              {user.branchName ? ` · ${user.branchName}` : user.role === "admin" ? " · Admin" : ""}
            </p>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 underline">
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      <nav className="sticky bottom-0 border-t border-orange-100 bg-white px-2 py-2 safe-area-pb">
        <div className="flex justify-around gap-1 overflow-x-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium ${
                  isActive
                    ? "bg-pittacos-100 text-pittacos-700"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
