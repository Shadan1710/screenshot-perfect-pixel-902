import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  initialLedger,
  listings as seedListings,
  routeLegs,
  seededIncidents,
  vehicles,
} from "@/mock/data";
import type {
  AuthSession,
  Booking,
  IncidentRecord,
  LedgerEntry,
  Role,
  RouteLeg,
  User,
  Vehicle,
} from "@/mock/types";

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

interface SignInInput {
  email: string;
  password: string;
  role: Role;
}

interface SignUpInput extends SignInInput {
  fullName: string;
  organization: string;
}

interface AppStore {
  // auth
  session: AuthSession | null;
  isAuthenticated: boolean;
  user: User | null;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  signIn: (input: SignInInput) => Promise<{ ok: boolean; error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  requestReset: (email: string) => Promise<{ ok: boolean; error?: string }>;

  // fleet
  vehicles: Vehicle[];
  legs: RouteLeg[];
  listings: typeof seedListings;
  vehicleForLeg: (legId: string) => Vehicle;
  legById: (legId: string) => RouteLeg;

  // ledger
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, "id" | "timestamp">) => void;
  correctLedgerEntry: (entryId: string, correctedDeltaKg: number, reason: string) => void;

  // bookings
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "timestamp">) => void;

  // incidents
  incidents: IncidentRecord[];
  addIncident: (incident: Omit<IncidentRecord, "id" | "timestamp" | "resolved">) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeRole, setActiveRole] = useState<Role>("dispatcher");
  const [ledger, setLedger] = useState<LedgerEntry[]>(initialLedger);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(seededIncidents);

  const startSession = useCallback((user: User) => {
    setSession({ id: uid("ses"), user, issuedAt: new Date().toISOString() });
    setActiveRole(user.role);
  }, []);

  const signIn = useCallback<AppStore["signIn"]>(
    async ({ email, password, role }) => {
      await delay(600);
      if (!email.includes("@") || password.length < 6) {
        return { ok: false, error: "Incorrect email or password" };
      }
      startSession({
        id: uid("usr"),
        fullName: (email.split("@")[0] ?? "User").replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        organization: role === "dispatcher" ? "Delhi NDLS Hub" : "Bluedart Express",
        role,
      });
      return { ok: true };
    },
    [startSession],
  );

  const signUp = useCallback<AppStore["signUp"]>(
    async ({ email, password, role, fullName, organization }) => {
      await delay(700);
      if (!email.includes("@") || password.length < 6) {
        return { ok: false, error: "Check the email and password before continuing" };
      }
      startSession({ id: uid("usr"), fullName, email, organization, role });
      return { ok: true };
    },
    [startSession],
  );

  const signOut = useCallback(() => {
    setSession(null);
    setActiveRole("dispatcher");
  }, []);

  const requestReset = useCallback<AppStore["requestReset"]>(async (email) => {
    await delay(600);
    if (!email.includes("@")) return { ok: false, error: "Enter a valid work email address" };
    return { ok: true };
  }, []);

  const addLedgerEntry = useCallback<AppStore["addLedgerEntry"]>((entry) => {
    setLedger((prev) => [...prev, { ...entry, id: uid("led"), timestamp: new Date().toISOString() }]);
  }, []);

  const correctLedgerEntry = useCallback<AppStore["correctLedgerEntry"]>(
    (entryId, correctedDeltaKg, reason) => {
      setLedger((prev) => {
        const original = prev.find((e) => e.id === entryId);
        if (!original) return prev;
        return [
          ...prev,
          {
            ...original,
            id: uid("led"),
            timestamp: new Date().toISOString(),
            type: "manual",
            deltaKg: correctedDeltaKg,
            correctsEntryId: entryId,
            reason,
            note: `Correction of ${entryId}`,
          },
        ];
      });
    },
    [],
  );

  const addBooking = useCallback<AppStore["addBooking"]>((booking) => {
    setBookings((prev) => [...prev, { ...booking, id: uid("bkg"), timestamp: new Date().toISOString() }]);
  }, []);

  const addIncident = useCallback<AppStore["addIncident"]>((incident) => {
    setIncidents((prev) => [
      ...prev,
      { ...incident, id: uid("inc"), timestamp: new Date().toISOString(), resolved: true },
    ]);
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      user: session?.user ?? null,
      activeRole,
      setActiveRole,
      signIn,
      signUp,
      signOut,
      requestReset,
      vehicles,
      legs: routeLegs,
      listings: seedListings,
      vehicleForLeg: (legId) => {
        const leg = routeLegs.find((l) => l.id === legId) ?? routeLegs[0]!;
        return vehicles.find((v) => v.id === leg.vehicleId) ?? vehicles[0]!;
      },
      legById: (legId) => routeLegs.find((l) => l.id === legId) ?? routeLegs[0]!,
      ledger,
      addLedgerEntry,
      correctLedgerEntry,
      bookings,
      addBooking,
      incidents,
      addIncident,
    }),
    [
      session,
      activeRole,
      signIn,
      signUp,
      signOut,
      requestReset,
      ledger,
      addLedgerEntry,
      correctLedgerEntry,
      bookings,
      addBooking,
      incidents,
      addIncident,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
