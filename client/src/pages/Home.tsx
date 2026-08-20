/**
 * Style reminder — Pocket Field Notes: an asymmetric, warm editorial journal.
 * Use Coral Bloom, moss ink, paper surfaces, handwritten accents, and gentle motion.
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  CloudOff,
  Coffee,
  Download,
  GlassWater,
  HeartPulse,
  Home as HomeIcon,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type Page = "dashboard" | "capture" | "reflections" | "schedule" | "health" | "review";
type Outcome = "berhasil" | "sebagian" | "belum";
type TaskPriority = "important-urgent" | "important-not-urgent" | "not-important-urgent" | "not-important-not-urgent";
type ActivityLabel = "Routine" | "Hobbies" | "Lectures" | "Works" | "Leisures";

type Reflection = {
  id: string;
  title: string;
  date: string;
  category: string;
  emotions: string;
  event: string;
  impactSelf: string;
  impactOthers: string;
  ownership: string;
  rootCause: string;
  lesson: string;
  action: string;
  actionStart: string;
  reviewDate: string;
  createdAt: string;
};

type HealthCheckin = { sleep: string; energy: string; mood: string; water: string; movement: string; note: string };
type Ritual = { id: string; label: string; area: string; createdAt: string };
type FoodEntry = {
  id: string;
  date: string;
  type: "Makanan" | "Minuman";
  meal: string;
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
};
type NutritionTargets = { kcal: number; carbs: number; protein: number; fat: number };
type ScheduleTask = { id: string; date: string; time: string; title: string; note: string; priority: TaskPriority; activityLabel: ActivityLabel; done: boolean };
type FitnessPlan = { id: string; date: string; time: string; activity: string; duration: string; note: string; done: boolean };
type AppData = {
  reflections: Reflection[];
  practiceLogs: Record<string, Outcome>;
  healthCheckins: Record<string, HealthCheckin>;
  routines: Record<string, boolean>;
  rituals: Ritual[];
  foodEntries: FoodEntry[];
  nutritionTargets: NutritionTargets;
  scheduleTasks: ScheduleTask[];
  fitnessPlans: FitnessPlan[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "ruang-tumbuh-pwa-v2";
const ASSET_ORIGIN = "https://ruangtumbuh-7wc6sasx.manus.space/manus-storage";
const APP_BASE_PATH = import.meta.env.BASE_URL;
const characterIcon = `${ASSET_ORIGIN}/ruang_tumbuh_icons_512_c29cd8f9.png`;
const heroImage = `${ASSET_ORIGIN}/ruang-tumbuh-hero_f37dd730.png`;
const journalTexture = `${ASSET_ORIGIN}/ruang-tumbuh-journal-texture_e33bf21c.png`;
const emptyStateImage = `${ASSET_ORIGIN}/ruang-tumbuh-empty-state_6236e615.png`;
const logoMark = `${ASSET_ORIGIN}/ruang-tumbuh-logo_c327dcaa.png`;

const pageInfo: Record<Page, { label: string; title: string; prompt: string }> = {
  dashboard: { label: "Beranda", title: "Selamat datang", prompt: "Satu langkah pada satu waktu." },
  capture: { label: "Catat kejadian", title: "Mulai dari fakta", prompt: "Apa yang benar-benar terjadi hari ini?" },
  reflections: { label: "Refleksi & langkah", title: "Yang sedang kamu pelajari", prompt: "Temukan pola dan pilih langkah kecil yang bisa dicoba." },
  schedule: { label: "Jadwal", title: "Hari yang bisa kamu kelola", prompt: "Susun hal kecil untuk dirawat hari ini." },
  health: { label: "Kesehatan", title: "Dukung tubuhmu", prompt: "Data tubuh adalah isyarat, bukan penilaian." },
  review: { label: "Tinjauan", title: "Lihat pola minggu ini", prompt: "Perbaiki sistemnya dengan rasa ingin tahu." },
};

const navItems: { id: Page; icon: typeof HomeIcon }[] = [
  { id: "dashboard", icon: HomeIcon },
  { id: "capture", icon: CirclePlus },
  { id: "reflections", icon: BookOpenText },
  { id: "schedule", icon: CalendarDays },
  { id: "health", icon: HeartPulse },
  { id: "review", icon: BarChart3 },
];

const categories = ["Kerja", "Kuliah", "Komunikasi", "Hubungan", "Kesehatan", "Diri sendiri", "Lainnya"];
const taskPriorityOptions: { value: TaskPriority; label: string; hint: string }[] = [
  { value: "important-urgent", label: "Penting & mendesak", hint: "Kerjakan lebih dulu" },
  { value: "important-not-urgent", label: "Penting, tidak mendesak", hint: "Jadwalkan dengan tenang" },
  { value: "not-important-urgent", label: "Tidak penting, mendesak", hint: "Selesaikan seperlunya" },
  { value: "not-important-not-urgent", label: "Tidak penting, tidak mendesak", hint: "Bisa ditunda" },
];
const activityLabelOptions: ActivityLabel[] = ["Routine", "Hobbies", "Lectures", "Works", "Leisures"];
const priorityRank: Record<TaskPriority, number> = { "important-urgent": 0, "important-not-urgent": 1, "not-important-urgent": 2, "not-important-not-urgent": 3 };
const priorityLabels: Record<TaskPriority, string> = Object.fromEntries(taskPriorityOptions.map(option => [option.value, option.label])) as Record<TaskPriority, string>;

function normalizeTaskPriority(value: unknown): TaskPriority {
  return taskPriorityOptions.some(option => option.value === value) ? value as TaskPriority : "important-not-urgent";
}

function normalizeActivityLabel(value: unknown): ActivityLabel {
  return activityLabelOptions.includes(value as ActivityLabel) ? value as ActivityLabel : "Routine";
}

function normalizeScheduleTask(task: ScheduleTask): ScheduleTask {
  return { ...task, priority: normalizeTaskPriority(task.priority), activityLabel: normalizeActivityLabel(task.activityLabel) };
}

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function displayDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function shortDate(value: string) {
  if (!value) return "hari ini";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function emptyData(): AppData {
  return { reflections: [], practiceLogs: {}, healthCheckins: {}, routines: {}, rituals: [], foodEntries: [], nutritionTargets: { kcal: 0, carbs: 0, protein: 0, fat: 0 }, scheduleTasks: [], fitnessPlans: [] };
}

function loadData(): AppData {
  try {
    const source = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!source || !Array.isArray(source.reflections)) return emptyData();
    return {
      reflections: source.reflections,
      practiceLogs: source.practiceLogs && typeof source.practiceLogs === "object" ? source.practiceLogs : {},
      healthCheckins: source.healthCheckins && typeof source.healthCheckins === "object" ? source.healthCheckins : {},
      routines: source.routines && typeof source.routines === "object" ? source.routines : {},
      rituals: Array.isArray(source.rituals) ? source.rituals : [],
      foodEntries: Array.isArray(source.foodEntries) ? source.foodEntries : [],
      nutritionTargets: source.nutritionTargets && typeof source.nutritionTargets === "object" ? {
        kcal: Math.max(0, Number(source.nutritionTargets.kcal) || 0), carbs: Math.max(0, Number(source.nutritionTargets.carbs) || 0),
        protein: Math.max(0, Number(source.nutritionTargets.protein) || 0), fat: Math.max(0, Number(source.nutritionTargets.fat) || 0),
      } : { kcal: 0, carbs: 0, protein: 0, fat: 0 },
      scheduleTasks: Array.isArray(source.scheduleTasks) ? source.scheduleTasks.map(normalizeScheduleTask) : [],
      fitnessPlans: Array.isArray(source.fitnessPlans) ? source.fitnessPlans : [],
    };
  } catch {
    return emptyData();
  }
}

function StatCard({ value, label, tone = "cream" }: { value: string | number; label: string; tone?: "cream" | "pink" | "green" | "yellow" }) {
  return <article className={`stat-card stat-card--${tone}`}><strong>{value}</strong><span>{label}</span></article>;
}

function ReflectionCard({ entry, onOpen }: { entry: Reflection; onOpen: () => void }) {
  return (
    <button className="reflection-card" onClick={onOpen} type="button">
      <span className="card-tab" />
      <div className="card-meta"><span>{shortDate(entry.date)}</span><span>{entry.category}</span></div>
      <h3>{entry.title}</h3>
      <p>{entry.lesson || entry.event || "Refleksi ini masih menunggu untuk dilengkapi."}</p>
      <span className="card-link">{entry.action ? "Ada latihan untuk dicoba" : "Buka catatan"}<ArrowRight size={14} /></span>
    </button>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function UtensilsGlyph({ size = 20 }: { size?: number }) {
  return <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">⌁</span>;
}

function nutritionProgress(value: number, target: number, unit: string) {
  const shownValue = value.toLocaleString("id-ID");
  return target > 0 ? `${shownValue} / ${target.toLocaleString("id-ID")} ${unit}` : `${shownValue} ${unit}`;
}

function formatNutritionNumber(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function NutritionMacroValue({ value, target, pulseKey }: { value: number; target: number; pulseKey: number }) {
  return <strong className="nutrition-macro-value"><AnimatedNutritionNumber value={value} pulseKey={pulseKey} /><small>{target > 0 ? ` / ${formatNutritionNumber(target)} g` : " g"}</small></strong>;
}

function AnimatedNutritionNumber({ value, pulseKey }: { value: number; pulseKey: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    previousValue.current = value;
    if (pulseKey === 0 || startValue === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }
    const duration = 640;
    const startedAt = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, pulseKey]);

  return <span key={`nutrition-number-${pulseKey}`} className={pulseKey > 0 ? "nutrition-total-number nutrition-total-number--animate" : "nutrition-total-number"}>{formatNutritionNumber(displayValue)}</span>;
}

function NutritionProgressBar({ value, target, tone, label, pulseKey }: { value: number; target: number; tone: "calorie" | "carbs" | "protein" | "fat"; label: string; pulseKey: number }) {
  const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const shouldAnimate = pulseKey > 0 && target > 0;
  return <div className={`nutrition-progress nutrition-progress--${tone}${target > 0 ? "" : " nutrition-progress--inactive"}${shouldAnimate ? " nutrition-progress--celebrate" : ""}`}><div className="nutrition-progress__meta"><span key={`${tone}-text-${pulseKey}`}>{target > 0 ? `${percent}%` : "—"}</span></div><div className="nutrition-progress__track" role="progressbar" aria-label={`Progres ${label}`} aria-valuemin={0} aria-valuemax={target || 100} aria-valuenow={Math.min(value, target || 0)}><span key={`${tone}-bar-${pulseKey}`} style={{ width: `${percent}%` }} /></div></div>;
}

export default function Home() {
  const [page, setPage] = useState<Page>(() => {
    const requestedView = new URLSearchParams(window.location.search).get("view");
    if (requestedView === "practice") return "reflections";
    return navItems.some(item => item.id === requestedView) ? requestedView as Page : "dashboard";
  });
  const [data, setData] = useState<AppData>(() => loadData());
  const [filter, setFilter] = useState("Semua");
  const [selected, setSelected] = useState<Reflection | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [nutritionPulse, setNutritionPulse] = useState(0);
  const today = localDate();

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
    };
  }, []);

  const practices = useMemo(() => data.reflections.filter(item => item.action.trim()), [data.reflections]);
  const recentReflections = useMemo(() => [...data.reflections].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.reflections]);
  const dueReviews = data.reflections.filter(item => item.reviewDate && item.reviewDate <= today).length;
  const currentCheckin = data.healthCheckins[today] || { sleep: "", energy: "", mood: "", water: "", movement: "", note: "" };
  const routinesDone = data.rituals.filter(item => data.routines[`${today}-${item.id}`]).length;
  const activeCategories = ["Semua", ...Array.from(new Set(data.reflections.map(item => item.category)))];
  const todayFoodEntries = useMemo(() => data.foodEntries.filter(entry => entry.date === today), [data.foodEntries, today]);
  const nutritionTotals = useMemo(() => todayFoodEntries.reduce((total, entry) => ({
    kcal: total.kcal + entry.kcal,
    carbs: total.carbs + entry.carbs,
    protein: total.protein + entry.protein,
    fat: total.fat + entry.fat,
  }), { kcal: 0, carbs: 0, protein: 0, fat: 0 }), [todayFoodEntries]);
  const todayScheduleTasks = useMemo(() => data.scheduleTasks.filter(task => task.date === today).sort((a, b) => {
    const priorityDifference = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDifference) return priorityDifference;
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.time || "99:99").localeCompare(b.time || "99:99");
  }), [data.scheduleTasks, today]);
  const todayFitnessPlans = useMemo(() => data.fitnessPlans.filter(plan => plan.date === today).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")), [data.fitnessPlans, today]);
  const scheduleDone = todayScheduleTasks.filter(task => task.done).length + todayFitnessPlans.filter(plan => plan.done).length;
  const scheduleTotal = todayScheduleTasks.length + todayFitnessPlans.length;

  function goTo(next: Page) {
    setPage(next);
    setMenuOpen(false);
    window.history.replaceState({}, "", next === "dashboard" ? APP_BASE_PATH : `${APP_BASE_PATH}?view=${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateData(updater: (previous: AppData) => AppData) { setData(updater); }

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") toast.success("Ruang Tumbuh sedang ditambahkan ke perangkatmu.");
      setInstallPrompt(null);
      return;
    }
    toast.message("Di iPhone/iPad, pilih Bagikan lalu ‘Tambahkan ke Layar Utama’. Di Android, gunakan menu browser untuk memasang aplikasi.");
  }

  function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry: Reflection = {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(),
      title: String(form.get("title") || "Catatan tanpa judul").trim(), date: String(form.get("date") || today),
      category: String(form.get("category") || "Lainnya"), emotions: String(form.get("emotions") || "").trim(),
      event: String(form.get("event") || "").trim(), impactSelf: String(form.get("impactSelf") || "").trim(),
      impactOthers: String(form.get("impactOthers") || "").trim(), ownership: String(form.get("ownership") || "").trim(),
      rootCause: String(form.get("rootCause") || "").trim(), lesson: String(form.get("lesson") || "").trim(),
      action: String(form.get("action") || "").trim(), actionStart: String(form.get("actionStart") || ""), reviewDate: String(form.get("reviewDate") || ""),
    };
    updateData(previous => ({ ...previous, reflections: [entry, ...previous.reflections] }));
    event.currentTarget.reset();
    toast.success("Refleksi tersimpan secara lokal di perangkat ini.");
    goTo("reflections");
  }

  function logPractice(entryId: string, outcome: Outcome) {
    updateData(previous => ({ ...previous, practiceLogs: { ...previous.practiceLogs, [`${today}-${entryId}`]: outcome } }));
    toast.success("Status latihan hari ini tercatat.");
  }

  function saveHealth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const checkin: HealthCheckin = {
      sleep: String(form.get("sleep") || ""), energy: String(form.get("energy") || ""), mood: String(form.get("mood") || ""),
      water: String(form.get("water") || ""), movement: String(form.get("movement") || ""), note: String(form.get("note") || ""),
    };
    updateData(previous => ({ ...previous, healthCheckins: { ...previous.healthCheckins, [today]: checkin } }));
    toast.success("Check-in tubuh tersimpan.");
  }

  function toggleRoutine(id: string) {
    const key = `${today}-${id}`;
    updateData(previous => ({ ...previous, routines: { ...previous.routines, [key]: !previous.routines[key] } }));
  }

  function addRitual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ritual: Ritual = {
      id: crypto.randomUUID(),
      label: String(form.get("ritualLabel") || "").trim(),
      area: String(form.get("ritualArea") || "Ritual pribadi").trim() || "Ritual pribadi",
      createdAt: new Date().toISOString(),
    };
    if (!ritual.label) return;
    updateData(previous => ({ ...previous, rituals: [...previous.rituals, ritual] }));
    event.currentTarget.reset();
    toast.success("Ritual pribadi ditambahkan.");
  }

  function deleteRitual(ritualId: string) {
    updateData(previous => ({
      ...previous,
      rituals: previous.rituals.filter(ritual => ritual.id !== ritualId),
      routines: Object.fromEntries(Object.entries(previous.routines).filter(([key]) => !key.endsWith(`-${ritualId}`))),
    }));
    toast.success("Ritual dihapus dari daftar.");
  }

  function addScheduleTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task: ScheduleTask = {
      id: crypto.randomUUID(), date: today, time: String(form.get("time") || ""),
      title: String(form.get("title") || "").trim(), note: String(form.get("note") || "").trim(),
      priority: normalizeTaskPriority(form.get("priority")), activityLabel: normalizeActivityLabel(form.get("activityLabel")), done: false,
    };
    if (!task.title) return;
    updateData(previous => ({ ...previous, scheduleTasks: [...previous.scheduleTasks, task] }));
    event.currentTarget.reset();
    toast.success("Kegiatan masuk ke Jadwal hari ini.");
  }

  function setScheduleTaskDone(taskId: string, done: boolean) {
    updateData(previous => ({ ...previous, scheduleTasks: previous.scheduleTasks.map(task => task.id === taskId ? { ...task, done } : task) }));
  }

  function deleteScheduleTask(taskId: string) {
    updateData(previous => ({ ...previous, scheduleTasks: previous.scheduleTasks.filter(task => task.id !== taskId) }));
    toast.success("Kegiatan dihapus dari Jadwal.");
  }

  function addFitnessPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plan: FitnessPlan = {
      id: crypto.randomUUID(), date: today, time: String(form.get("fitnessTime") || ""), activity: String(form.get("fitnessActivity") || "").trim(),
      duration: String(form.get("fitnessDuration") || "").trim(), note: String(form.get("fitnessNote") || "").trim(), done: false,
    };
    if (!plan.activity) return;
    updateData(previous => ({ ...previous, fitnessPlans: [...previous.fitnessPlans, plan] }));
    event.currentTarget.reset();
    toast.success("Rencana Kebugaran masuk ke Jadwal hari ini.");
  }

  function setFitnessPlanDone(planId: string, done: boolean) {
    updateData(previous => ({ ...previous, fitnessPlans: previous.fitnessPlans.map(plan => plan.id === planId ? { ...plan, done } : plan) }));
  }

  function deleteFitnessPlan(planId: string) {
    updateData(previous => ({ ...previous, fitnessPlans: previous.fitnessPlans.filter(plan => plan.id !== planId) }));
    toast.success("Rencana Kebugaran dihapus.");
  }

  function addFoodEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numberValue = (field: string) => Math.max(0, Number(form.get(field)) || 0);
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      date: today,
      type: String(form.get("type")) === "Minuman" ? "Minuman" : "Makanan",
      meal: String(form.get("meal") || "Lainnya"),
      name: String(form.get("name") || "").trim(),
      kcal: numberValue("kcal"),
      carbs: numberValue("carbs"),
      protein: numberValue("protein"),
      fat: numberValue("fat"),
    };
    updateData(previous => ({ ...previous, foodEntries: [entry, ...previous.foodEntries] }));
    setNutritionPulse(previous => previous + 1);
    event.currentTarget.reset();
    toast.success("Catatan makanan atau minuman ditambahkan.");
  }

  function deleteFoodEntry(entryId: string) {
    updateData(previous => ({ ...previous, foodEntries: previous.foodEntries.filter(entry => entry.id !== entryId) }));
    toast.success("Catatan nutrisi dihapus.");
  }

  function saveNutritionTargets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numberValue = (field: string) => Math.max(0, Number(form.get(field)) || 0);
    updateData(previous => ({ ...previous, nutritionTargets: { kcal: numberValue("targetKcal"), carbs: numberValue("targetCarbs"), protein: numberValue("targetProtein"), fat: numberValue("targetFat") } }));
    toast.success("Target nutrisi pribadi disimpan.");
  }

  function exportData() {
    const file = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `ruang-tumbuh-${today}.json`; anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Cadangan data berhasil diunduh.");
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const source = JSON.parse(String(reader.result));
        if (!Array.isArray(source.reflections)) throw new Error("invalid");
        setData({
          reflections: source.reflections,
          practiceLogs: source.practiceLogs && typeof source.practiceLogs === "object" ? source.practiceLogs : {},
          healthCheckins: source.healthCheckins && typeof source.healthCheckins === "object" ? source.healthCheckins : {},
          routines: source.routines && typeof source.routines === "object" ? source.routines : {},
          rituals: Array.isArray(source.rituals) ? source.rituals : [],
          foodEntries: Array.isArray(source.foodEntries) ? source.foodEntries : [],
          nutritionTargets: source.nutritionTargets && typeof source.nutritionTargets === "object" ? {
            kcal: Math.max(0, Number(source.nutritionTargets.kcal) || 0), carbs: Math.max(0, Number(source.nutritionTargets.carbs) || 0),
            protein: Math.max(0, Number(source.nutritionTargets.protein) || 0), fat: Math.max(0, Number(source.nutritionTargets.fat) || 0),
          } : { kcal: 0, carbs: 0, protein: 0, fat: 0 },
          scheduleTasks: Array.isArray(source.scheduleTasks) ? source.scheduleTasks.map(normalizeScheduleTask) : [],
          fitnessPlans: Array.isArray(source.fitnessPlans) ? source.fitnessPlans : [],
        });
        toast.success("Cadangan berhasil dipulihkan.");
      } catch { toast.error("File tidak terbaca. Pilih cadangan Ruang Tumbuh yang valid."); }
    };
    reader.readAsText(file); event.target.value = "";
  }

  function clearAllData() {
    if (!window.confirm("Hapus semua refleksi, latihan, dan catatan kesehatan dari perangkat ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setData(emptyData()); toast.success("Seluruh data lokal telah dihapus.");
  }

  const sidebar = (
    <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`} aria-label="Navigasi utama">
      <button type="button" className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={19} /></button>
      <button className="brand" onClick={() => goTo("dashboard")} type="button" aria-label="Ruang Tumbuh, beranda">
        <img src={logoMark} alt="" /><span>Ruang<br /><em>Tumbuh</em></span>
      </button>
      <nav className="side-nav">
        {navItems.map(({ id, icon: Icon }) => <button type="button" key={id} className={page === id ? "nav-item nav-item--active" : "nav-item"} onClick={() => goTo(id)}><Icon size={18} /><span>{pageInfo[id].label}</span></button>)}
      </nav>
      <div className="side-foot">
        <p>Kesalahan bukan bukti bahwa kamu buruk. Ia bisa menjadi data untuk bertumbuh.</p>
        <button type="button" onClick={() => setPrivacyOpen(true)}><ShieldCheck size={15} /> Tentang privasi</button>
      </div>
    </aside>
  );

  return (
    <div className="app-shell">
      {sidebar}
      {menuOpen && <button type="button" className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />}
      <main className="main-content">
        <header className="topbar">
          <button type="button" className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={20} /></button>
          <button type="button" className="topbar-brand" onClick={() => goTo("dashboard")} aria-label="Ruang Tumbuh, beranda"><img src={logoMark} alt="" /><span>Ruang<br /><em>Tumbuh</em></span></button>
          <div className="topbar-title"><p className="eyebrow">{pageInfo[page].prompt}</p><h1>{pageInfo[page].title}</h1></div>
          <div className="topbar-tools">
            <span className={isOnline ? "network-chip" : "network-chip network-chip--offline"}>{isOnline ? <Activity size={14} /> : <CloudOff size={14} />}{isOnline ? "Tersinkron lokal" : "Sedang offline"}</span>
            <button type="button" className="install-button" onClick={installApp}><Download size={16} /><span>Pasang aplikasi</span></button>
          </div>
        </header>

        {page === "dashboard" && <section className="page page--active dashboard-page">
          <section className="hero-card">
            <aside className="hero-ribbon" aria-label="Penanda halaman"><span>RUANG</span><b>01</b><span>TUMBUH</span></aside>
            <div className="hero-copy"><p className="eyebrow">RUANG UNTUK MENGAMATI</p><h2>Ubah pengalaman menjadi <i>arah.</i></h2><p>Catat hal yang terjadi, lihat bagian yang dapat kamu rawat, lalu pilih perubahan kecil yang bisa dilatih.</p><button type="button" className="primary-button" onClick={() => goTo("capture")}>Mulai mencatat <ArrowRight size={17} /></button></div>
            <div className="hero-image"><img src={heroImage} alt="Ilustrasi seseorang menulis catatan refleksi" /><div className="hero-sticker hero-sticker--one">amati</div><div className="hero-sticker hero-sticker--two">pelajari</div><div className="hero-sticker hero-sticker--three">latih</div></div>
          </section>

          <section className="section-block"><div className="section-title"><div><p className="eyebrow">GAMBARAN HARI INI</p><h2>Perjalananmu</h2></div><button type="button" className="text-button" onClick={() => goTo("review")}>Lihat tinjauan <ChevronRight size={16} /></button></div>
            <div className="stats-row"><StatCard value={data.reflections.length} label="kejadian dicatat" tone="pink" /><StatCard value={practices.length} label="langkah aktif" tone="green" /><StatCard value={`${scheduleDone}/${scheduleTotal}`} label="kegiatan hari ini" tone="yellow" /><StatCard value={dueReviews} label="tinjauan yang menunggu" /></div>
          </section>

          <section className="dashboard-notes">
            <article className="active-practice panel-paper"><div className="panel-head"><div><p className="eyebrow">LANGKAH BERIKUTNYA</p><h2>Refleksi & langkah</h2></div><button type="button" className="round-link" onClick={() => goTo("reflections")} aria-label="Buka refleksi dan langkah"><ArrowRight size={18} /></button></div>
              {practices.length ? <div className="practice-preview">{practices.slice(0, 2).map(item => <div key={item.id}><span>Eksperimen</span><h3>{item.title}</h3><p>{item.action}</p></div>)}</div> : <div className="empty-inline"><img src={emptyStateImage} alt="" /><div><h3>Belum ada langkah aktif</h3><p>Setelah mencatat, pilih satu tindakan kecil yang dapat kamu coba.</p><button type="button" className="text-button" onClick={() => goTo("capture")}>Catat kejadian <ArrowRight size={14} /></button></div></div>}
            </article>
            <aside className="note-card"><span className="note-pin">✦</span><p className="eyebrow">PENGINGAT LEMBUT</p><blockquote>“Tanggung jawab bukan tentang menyalahkan diri; melainkan mengurus bagian yang memang menjadi bagianmu.”</blockquote><small>— untuk dirimu hari ini</small></aside>
          </section>

          <section className="section-block journal-section"><div className="section-title"><div><p className="eyebrow">CATATAN TERBARU</p><h2>Yang sedang kamu pelajari</h2></div><button type="button" className="text-button" onClick={() => goTo("reflections")}>Lihat semua <ChevronRight size={16} /></button></div>
            {recentReflections.length ? <div className="reflection-grid">{recentReflections.slice(0, 3).map(entry => <ReflectionCard key={entry.id} entry={entry} onOpen={() => setSelected(entry)} />)}</div> : <div className="starter-note"><img src={characterIcon} alt="" /><div><p className="eyebrow">HALAMAN PERTAMA</p><h3>Mulai dari satu hal yang ingin kamu pahami.</h3><p>Tidak perlu sempurna. Cukup tulis fakta yang sedang ada di depanmu.</p><button type="button" className="primary-button primary-button--small" onClick={() => goTo("capture")}>Buka halaman kosong <ArrowRight size={15} /></button></div></div>}
          </section>
        </section>}

        {page === "capture" && <section className="page page--active capture-page"><PageHeading eyebrow="CATAT KEJADIAN" title="Mulai dari fakta, bukan vonis." description="Tuliskan apa yang terjadi dengan jujur dan ringkas. Kamu dapat melengkapi refleksinya sekarang atau kapan pun nanti." />
          <form className="reflection-form" onSubmit={saveReflection}>
            <section className="form-section capture-step capture-step--fact"><div className="capture-step-header"><span>01</span><div><h3>Apa yang terjadi?</h3><p>Fakta yang bisa diamati, tanpa menempelkan vonis pada dirimu.</p></div></div><div className="form-grid form-grid--two"><label>Judul singkat<input required name="title" maxLength={90} placeholder="Contoh: Terlambat mengirim bagian tugas" /></label><label>Tanggal kejadian<input required name="date" type="date" defaultValue={today} /></label><label>Kategori<select name="category">{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Emosi yang terasa<input name="emotions" maxLength={100} placeholder="Contoh: cemas, malu, defensif" /></label></div><label>Apa yang terjadi?<textarea required name="event" rows={5} placeholder="Contoh: Aku baru mulai mengerjakan pukul 18.00, padahal deadline-nya malam ini." /></label></section>
            <section className="form-section capture-step capture-step--impact"><div className="capture-step-header"><span>02</span><div><h3>Lihat dampak dan bagianmu</h3><p>Bertanggung jawab secara proporsional: bukan mengambil semua beban, bukan juga melemparnya.</p></div></div><div className="form-grid form-grid--two"><label>Dampak terhadap diri<textarea name="impactSelf" rows={4} placeholder="Apa dampaknya pada dirimu?" /></label><label>Dampak terhadap orang lain/pekerjaan<textarea name="impactOthers" rows={4} placeholder="Siapa atau apa yang ikut terdampak?" /></label></div><label>Bagian yang menjadi tanggung jawabku<textarea name="ownership" rows={4} placeholder="Apa yang berada dalam kendalimu dan bisa kamu akui tanpa menyalahkan diri berlebihan?" /></label></section>
            <section className="form-section form-section--coral capture-step capture-step--experiment"><div className="capture-step-header"><span>03</span><div><h3>Ambil pelajaran dan buat eksperimen</h3><p>Ubah refleksi menjadi perilaku kecil yang bisa dilihat dan diuji.</p></div></div><div className="form-grid form-grid--two"><label>Kemungkinan penyebab akar<textarea name="rootCause" rows={4} placeholder="Contoh: Aku memperkirakan waktu terlalu optimistis." /></label><label>Yang kupelajari tentang diriku<textarea name="lesson" rows={4} placeholder="Contoh: Aku cenderung menunda saat tugas terasa besar." /></label></div><label>Eksperimen perilaku baru<textarea name="action" rows={4} placeholder="Contoh: Begitu tugas diberikan, aku akan mengerjakannya minimal 30 menit pada hari yang sama." /></label><div className="form-grid form-grid--two form-grid--narrow"><label>Mulai latihan<input type="date" name="actionStart" defaultValue={today} /></label><label>Tinjau kembali<input type="date" name="reviewDate" /></label></div></section>
            <div className="form-actions"><p><ShieldCheck size={16} /> Data ini hanya disimpan di browser perangkat ini.</p><button className="primary-button" type="submit">Simpan refleksi <ArrowRight size={17} /></button></div>
          </form>
        </section>}

        {page === "reflections" && <section className="page page--active"><PageHeading eyebrow="REFLEKSI & LANGKAH" title="Pahami yang terjadi, lalu pilih langkah kecil." description="Kumpulkan pelajaran dari kejadian-kejadian kecil dan rawat eksperimen perilaku yang lahir darinya." action={<button type="button" className="primary-button" onClick={() => goTo("capture")}><Plus size={16} /> Catat baru</button>} />
          <div className="filter-row">{activeCategories.map(category => <button type="button" key={category} className={filter === category ? "filter-chip filter-chip--active" : "filter-chip"} onClick={() => setFilter(category)}>{category}</button>)}</div>
          {recentReflections.filter(entry => filter === "Semua" || entry.category === filter).length ? <div className="reflection-grid reflection-grid--full">{recentReflections.filter(entry => filter === "Semua" || entry.category === filter).map(entry => <ReflectionCard key={entry.id} entry={entry} onOpen={() => setSelected(entry)} />)}</div> : <div className="empty-page"><img src={emptyStateImage} alt="" /><h3>Belum ada catatan di sini.</h3><p>Mulai dengan satu kejadian yang ingin kamu pahami.</p><button type="button" className="text-button" onClick={() => goTo("capture")}>Catat kejadian <ArrowRight size={14} /></button></div>}
          <section className="steps-section panel-paper"><div className="panel-head"><div><p className="eyebrow">LANGKAH KECIL</p><h2>Eksperimen yang sedang kamu rawat</h2></div></div>{practices.length ? <div className="practice-list">{practices.map(entry => { const outcome = data.practiceLogs[`${today}-${entry.id}`]; return <article className="practice-card" key={entry.id}><div className="practice-content"><div className="practice-date"><CalendarDays size={15} /> Sejak {displayDate(entry.actionStart || entry.date)}</div><h3>{entry.title}</h3><p>{entry.action}</p></div><div className="outcome-list"><span>Hari ini terasa…</span><div>{(["berhasil", "sebagian", "belum"] as Outcome[]).map(item => <button key={item} type="button" className={outcome === item ? `outcome-button outcome-button--${item} outcome-button--selected` : `outcome-button outcome-button--${item}`} onClick={() => logPractice(entry.id, item)}>{item === "berhasil" ? <Check size={15} /> : item === "sebagian" ? <MoreHorizontal size={16} /> : <X size={15} />}{item === "berhasil" ? "Berhasil" : item === "sebagian" ? "Sebagian" : "Belum"}</button>)}</div></div></article>; })}</div> : <div className="empty-inline"><img src={emptyStateImage} alt="" /><div><h3>Belum ada langkah aktif</h3><p>Tambahkan eksperimen perilaku saat menulis refleksi untuk melihatnya di sini.</p></div></div>}</section>
        </section>}

        {page === "schedule" && <section className="page page--active schedule-page"><PageHeading eyebrow="JADWAL HARI INI" title="Beri ruang untuk hal yang perlu dikerjakan." description="Simpan kegiatan dan rencana hari ini di satu halaman sederhana." action={<span className="date-stamp">{displayDate(today)}</span>} />
          <section className="schedule-summary"><article><p className="eyebrow">CHECKPOINT HARI INI</p><strong>{scheduleDone}/{scheduleTotal}</strong><span>kegiatan selesai</span></article><div><p>Jadwal tidak harus penuh untuk terasa berarti.</p><small>Atur yang membantu, sisakan ruang untuk bernafas.</small></div></section>
          <div className="schedule-layout"><section className="schedule-main"><form className="schedule-form panel-paper" onSubmit={addScheduleTask}><div className="panel-head"><div><p className="eyebrow">TAMBAH KEGIATAN</p><h2>Apa yang ingin kamu lakukan?</h2></div></div><div className="schedule-inputs"><label>Jam (opsional)<input name="time" type="time" /></label><label>Nama kegiatan<input required name="title" maxLength={100} placeholder="Contoh: Mengirim revisi laporan" /></label><label className="schedule-priority-field">Prioritas<select name="priority" defaultValue="important-not-urgent">{taskPriorityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>Pilihan paling penting akan disematkan paling atas.</small></label><label className="schedule-label-field">Label aktivitas<select name="activityLabel" defaultValue="Routine">{activityLabelOptions.map(label => <option key={label}>{label}</option>)}</select></label><label className="schedule-note-field">Keterangan (opsional)<input name="note" maxLength={150} placeholder="Contoh: Cek ulang lampiran sebelum dikirim" /></label></div><button type="submit" className="primary-button"><Plus size={16} /> Masukkan ke Jadwal</button></form>
            <article className="schedule-list panel-paper"><div className="panel-head"><div><p className="eyebrow">TO-DO HARI INI</p><h2>Urutan yang bisa kamu pegang</h2></div></div>{todayScheduleTasks.length ? <div className="schedule-items">{todayScheduleTasks.map(task => <article key={task.id} className={task.done ? `schedule-item schedule-item--${task.priority} schedule-item--done` : `schedule-item schedule-item--${task.priority}`}><Checkbox id={`task-${task.id}`} className="schedule-check" checked={task.done} onCheckedChange={(checked) => setScheduleTaskDone(task.id, checked === true)} /><div className="schedule-time">{task.time || "kapan saja"}</div><label className="schedule-copy" htmlFor={`task-${task.id}`}><div className="schedule-badges"><span className={`task-priority task-priority--${task.priority}`}>{priorityLabels[task.priority]}</span><span className={`task-label task-label--${task.activityLabel.toLowerCase()}`}>{task.activityLabel}</span></div><h3>{task.title}</h3>{task.note && <p>{task.note}</p>}</label><button type="button" className="entry-delete" onClick={() => deleteScheduleTask(task.id)} aria-label={`Hapus ${task.title}`}><Trash2 size={16} /></button></article>)}</div> : <div className="schedule-empty"><span>◌</span><div><h3>Belum ada kegiatan.</h3><p>Masukkan satu hal yang ingin kamu selesaikan hari ini.</p></div></div>}</article>
            <article className="fitness-schedule panel-paper"><div className="panel-head"><div><p className="eyebrow">KEBUGARAN DARI KESEHATAN</p><h2>Rencana gerak hari ini</h2></div><span className="fitness-mark"><Activity size={17} /></span></div>{todayFitnessPlans.length ? <div className="schedule-items">{todayFitnessPlans.map(plan => <article key={plan.id} className={plan.done ? "schedule-item schedule-item--fitness schedule-item--done" : "schedule-item schedule-item--fitness"}><Checkbox id={`fitness-${plan.id}`} className="schedule-check" checked={plan.done} onCheckedChange={(checked) => setFitnessPlanDone(plan.id, checked === true)} /><div className="schedule-time">{plan.time || "fleksibel"}</div><label className="schedule-copy" htmlFor={`fitness-${plan.id}`}><h3>{plan.activity}</h3><p>{[plan.duration && `${plan.duration} menit`, plan.note].filter(Boolean).join(" · ") || "Rencana dari halaman Kesehatan"}</p></label><button type="button" className="entry-delete" onClick={() => deleteFitnessPlan(plan.id)} aria-label={`Hapus ${plan.activity}`}><Trash2 size={16} /></button></article>)}</div> : <div className="schedule-empty schedule-empty--fitness"><span><Activity size={15} /></span><div><h3>Belum ada rencana Kebugaran.</h3><p>Tambahkan dari halaman Kesehatan agar muncul otomatis di sini.</p></div></div>}</article></section>
          </div>
        </section>}

        {page === "health" && <section className="page page--active"><PageHeading eyebrow="CHECK-IN KESEHATAN" title="Rawat tubuh sebagai bagian dari pertumbuhanmu." description="Catat yang berguna bagimu. Pelacak ini membantu pengamatan pribadi, bukan pengganti nasihat tenaga kesehatan." />
          <section className="health-overview"><article className="health-summary"><p className="eyebrow">HARI INI · {displayDate(today)}</p><h3>{currentCheckin.sleep ? `${currentCheckin.sleep} jam tidur` : "Belum ada check-in"}</h3><div className="health-tags">{currentCheckin.energy && <span><Sun size={14} /> Energi {currentCheckin.energy}/5</span>}{currentCheckin.mood && <span><HeartPulse size={14} /> Mood {currentCheckin.mood}/5</span>}{currentCheckin.water && <span>◌ {currentCheckin.water} gelas air</span>}</div><p>{currentCheckin.note || "Dengarkan tubuhmu tanpa harus mengubahnya menjadi target."}</p></article><aside className="health-quote"><Moon size={22} /><blockquote>“Perawatan yang konsisten tidak harus rumit. Pilih yang bisa kamu lakukan lagi besok.”</blockquote></aside></section>
          <form className="health-form panel-paper" onSubmit={saveHealth}><div className="panel-head"><div><p className="eyebrow">CHECK-IN TUBUH</p><h2>Bagaimana keadaanmu hari ini?</h2></div></div><div className="health-fields"><label>Tidur (jam)<input type="number" name="sleep" min="0" max="24" step="0.5" defaultValue={currentCheckin.sleep} placeholder="mis. 7,5" /></label><label>Energi (1–5)<select name="energy" defaultValue={currentCheckin.energy}><option value="">Pilih</option>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label><label>Suasana hati (1–5)<select name="mood" defaultValue={currentCheckin.mood}><option value="">Pilih</option>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label><label>Air minum (gelas)<input type="number" name="water" min="0" max="50" defaultValue={currentCheckin.water} placeholder="mis. 6" /></label><label>Gerak (menit)<input type="number" name="movement" min="0" max="1440" defaultValue={currentCheckin.movement} placeholder="mis. 30" /></label></div><label>Catatan tubuh hari ini<textarea name="note" rows={3} defaultValue={currentCheckin.note} placeholder="Contoh: Bahu terasa tegang setelah duduk lama; berjalan sore membuatku lebih tenang." /></label><div className="form-actions"><p>Hanya catat yang membantumu melihat pola.</p><button type="submit" className="primary-button">Simpan check-in <ArrowRight size={17} /></button></div></form>
          <section className="nutrition-section"><div className="section-title"><div><p className="eyebrow">TRACKER MAKAN & MINUM</p><h2>Kenali asupanmu, dengan netral</h2></div><span className="entry-count"><Coffee size={16} /> {todayFoodEntries.length} catatan hari ini</span></div>
            <form className="nutrition-target-form" onSubmit={saveNutritionTargets}><div className="target-form-intro"><p className="eyebrow">TARGET PRIBADI HARIAN</p><h3>Atur angka yang ingin kamu pantau</h3><p>Kosongkan atau isi 0 bila tidak memakai target. Tidak ada rekomendasi otomatis.</p></div><div className="target-inputs"><label>Kalori (kcal)<input name="targetKcal" type="number" min="0" step="1" inputMode="numeric" defaultValue={data.nutritionTargets.kcal || ""} placeholder="mis. 2000" /></label><label>Karbohidrat (g)<input name="targetCarbs" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={data.nutritionTargets.carbs || ""} placeholder="mis. 250" /></label><label>Protein (g)<input name="targetProtein" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={data.nutritionTargets.protein || ""} placeholder="mis. 90" /></label><label>Lemak (g)<input name="targetFat" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={data.nutritionTargets.fat || ""} placeholder="mis. 65" /></label></div><button type="submit" className="target-save">Simpan target <ArrowRight size={15} /></button></form>
            <div className="nutrition-overview"><article className="nutrition-kcal"><div><p className="eyebrow">TOTAL HARI INI</p><strong><AnimatedNutritionNumber value={nutritionTotals.kcal} pulseKey={nutritionPulse} /> <small>kcal</small></strong><p>{data.nutritionTargets.kcal > 0 ? `Target pribadi: ${data.nutritionTargets.kcal.toLocaleString("id-ID")} kcal.` : "Diinput mandiri, tanpa target atau penilaian."}</p><NutritionProgressBar value={nutritionTotals.kcal} target={data.nutritionTargets.kcal} tone="calorie" label="kalori" pulseKey={nutritionPulse} /></div><span><UtensilsGlyph /></span></article><div className="macro-grid"><article><span>Karbohidrat</span><NutritionMacroValue value={nutritionTotals.carbs} target={data.nutritionTargets.carbs} pulseKey={nutritionPulse} /><NutritionProgressBar value={nutritionTotals.carbs} target={data.nutritionTargets.carbs} tone="carbs" label="karbohidrat" pulseKey={nutritionPulse} /><i className="macro-bar macro-bar--carbs" /></article><article><span>Protein</span><NutritionMacroValue value={nutritionTotals.protein} target={data.nutritionTargets.protein} pulseKey={nutritionPulse} /><NutritionProgressBar value={nutritionTotals.protein} target={data.nutritionTargets.protein} tone="protein" label="protein" pulseKey={nutritionPulse} /><i className="macro-bar macro-bar--protein" /></article><article><span>Lemak</span><NutritionMacroValue value={nutritionTotals.fat} target={data.nutritionTargets.fat} pulseKey={nutritionPulse} /><NutritionProgressBar value={nutritionTotals.fat} target={data.nutritionTargets.fat} tone="fat" label="lemak" pulseKey={nutritionPulse} /><i className="macro-bar macro-bar--fat" /></article></div></div>
            <div className="nutrition-workspace"><form className="nutrition-form panel-paper" onSubmit={addFoodEntry}><div className="panel-head"><div><p className="eyebrow">TAMBAH CATATAN MANUAL</p><h2>Makan atau minum apa?</h2></div><span className="date-stamp">{shortDate(today)}</span></div><p className="form-intro">Masukkan angka yang kamu ketahui atau ingin catat sendiri. Semua kolom nutrisi bersifat opsional.</p><div className="nutrition-primary-fields"><label>Jenis konsumsi<select name="type" defaultValue="Makanan"><option>Makanan</option><option>Minuman</option></select></label><label>Waktu konsumsi<select name="meal" defaultValue="Sarapan"><option>Sarapan</option><option>Makan siang</option><option>Makan malam</option><option>Camilan</option><option>Minuman</option><option>Lainnya</option></select></label><label className="food-name-field">Nama makanan/minuman<input required name="name" maxLength={100} placeholder="Contoh: Nasi, ayam, dan sayur" /></label></div><div className="macro-input-grid"><label>Kalori (kcal)<input name="kcal" type="number" min="0" step="1" inputMode="numeric" placeholder="0" /></label><label>Karbohidrat (g)<input name="carbs" type="number" min="0" step="0.1" inputMode="decimal" placeholder="0" /></label><label>Protein (g)<input name="protein" type="number" min="0" step="0.1" inputMode="decimal" placeholder="0" /></label><label>Lemak (g)<input name="fat" type="number" min="0" step="0.1" inputMode="decimal" placeholder="0" /></label></div><div className="nutrition-actions"><p><GlassWater size={16} /> Data dicatat secara lokal di perangkat ini.</p><button type="submit" className="primary-button"><Plus size={16} /> Tambahkan</button></div></form>
              <article className="food-log panel-paper"><div className="panel-head"><div><p className="eyebrow">CATATAN HARI INI</p><h2>Makan & minum</h2></div><span className="food-log-mark">✦</span></div>{todayFoodEntries.length ? <div className="food-log-list">{todayFoodEntries.map(entry => <article key={entry.id} className="food-log-entry"><div className={entry.type === "Minuman" ? "food-type food-type--drink" : "food-type"}>{entry.type === "Minuman" ? <GlassWater size={15} /> : <UtensilsGlyph size={15} />}</div><div className="food-entry-copy"><div><span>{entry.meal}</span><h3>{entry.name}</h3></div><p><strong>{entry.kcal} kcal</strong><span>· {entry.carbs}g karbo</span><span>· {entry.protein}g protein</span><span>· {entry.fat}g lemak</span></p></div><button type="button" className="entry-delete" onClick={() => deleteFoodEntry(entry.id)} aria-label={`Hapus ${entry.name}`}><Trash2 size={16} /></button></article>)}</div> : <div className="food-log-empty"><img src={emptyStateImage} alt="" /><p>Belum ada makanan atau minuman yang dicatat hari ini.</p></div>}</article></div>
            <section className="fitness-section"><div className="section-title"><div><p className="eyebrow">BAGAN KEBUGARAN</p><h2>Gerak yang ingin kamu lakukan</h2></div><span className="entry-count"><Activity size={16} /> {todayFitnessPlans.length} rencana</span></div><div className="fitness-workspace"><form className="fitness-form panel-paper" onSubmit={addFitnessPlan}><div className="panel-head"><div><p className="eyebrow">RENCANA HARI INI</p><h2>Masukkan rencana gerak</h2></div></div><p>Rencana ini akan muncul otomatis sebagai checkpoint pada halaman Jadwal hari ini.</p><div className="fitness-inputs"><label>Jam (opsional)<input name="fitnessTime" type="time" /></label><label>Jenis olahraga/kegiatan<input required name="fitnessActivity" maxLength={100} placeholder="Contoh: Jalan santai" /></label><label>Durasi (menit, opsional)<input name="fitnessDuration" type="number" min="0" max="1440" inputMode="numeric" placeholder="mis. 30" /></label><label className="fitness-note-field">Keterangan (opsional)<input name="fitnessNote" maxLength={150} placeholder="Contoh: Keliling taman dekat rumah" /></label></div><button type="submit" className="primary-button"><Activity size={16} /> Tambahkan ke Jadwal</button></form><article className="fitness-preview panel-paper"><div className="panel-head"><div><p className="eyebrow">TERJADWAL HARI INI</p><h2>Rencana Kebugaran</h2></div><span className="fitness-mark"><Activity size={17} /></span></div>{todayFitnessPlans.length ? <div className="fitness-plan-list">{todayFitnessPlans.map(plan => <article key={plan.id} className={plan.done ? "fitness-plan-row fitness-plan-row--done" : "fitness-plan-row"}><div><span>{plan.time || "fleksibel"}</span><h3>{plan.activity}</h3><p>{[plan.duration && `${plan.duration} menit`, plan.note].filter(Boolean).join(" · ")}</p></div><button type="button" className="entry-delete" onClick={() => deleteFitnessPlan(plan.id)} aria-label={`Hapus ${plan.activity}`}><Trash2 size={16} /></button></article>)}</div> : <div className="food-log-empty"><img src={emptyStateImage} alt="" /><p>Belum ada rencana Kebugaran hari ini.</p></div>}</article></div></section>
          </section>
        </section>}

        {page === "review" && <section className="page page--active"><PageHeading eyebrow="TINJAUAN 7 HARI" title="Apa yang sedang kamu pelajari?" description="Tinjau pola dengan rasa ingin tahu; sesuaikan sistemnya bila eksperimen belum berjalan." action={<button type="button" className="outline-button" onClick={exportData}><Download size={16} /> Unduh data</button>} />
          <div className="review-grid"><StatCard value={data.reflections.filter(item => new Date(`${item.date}T12:00:00`) >= new Date(Date.now() - 6 * 86_400_000)).length} label="catatan dalam tujuh hari" tone="pink" /><StatCard value={`${Object.values(data.practiceLogs).filter(item => item === "berhasil").length}/${Object.keys(data.practiceLogs).length || "—"}`} label="latihan berhasil dicatat" tone="green" /><StatCard value={Object.keys(data.healthCheckins).length} label="check-in tubuh tersimpan" tone="yellow" /></div>
          <section className="review-prompt"><div className="prompt-number">?</div><div><p className="eyebrow">PERTANYAAN MINGGU INI</p><h3>Apa yang ingin diperbaiki dari sistemmu?</h3><p>{data.reflections.length ? "Pilih satu eksperimen yang paling kecil dan realistis. Jika belum berjalan, tanyakan apakah langkahnya terlalu besar atau dukungannya belum cukup." : "Catat satu kejadian yang ingin kamu pahami minggu ini. Mulailah dari fakta: apa yang terjadi, dan apa bagianmu?"}</p></div></section>
          <section className="data-control"><div><p className="eyebrow">DATA MILIKMU</p><h3>Semua catatan tinggal di perangkatmu.</h3><p>Gunakan file unduhan sebagai cadangan atau untuk memindahkan data ke perangkat lain.</p></div><div className="data-actions"><label className="outline-button"><Upload size={16} /> Pulihkan data<input type="file" accept="application/json" onChange={importData} hidden /></label><button type="button" className="danger-button" onClick={clearAllData}><X size={16} /> Hapus data lokal</button></div></section>
        </section>}
      </main>

      <nav className="bottom-nav" aria-label="Navigasi mobile">{navItems.slice(0, 5).map(({ id, icon: Icon }) => <button type="button" key={id} className={page === id ? "bottom-nav__item bottom-nav__item--active" : "bottom-nav__item"} onClick={() => goTo(id)}><Icon size={19} /><span>{id === "dashboard" ? "Beranda" : pageInfo[id].label.split(" ")[0]}</span></button>)}</nav>

      {selected && <div className="modal-layer" role="presentation"><button className="modal-backdrop" type="button" onClick={() => setSelected(null)} aria-label="Tutup detail" /><article className="detail-modal" role="dialog" aria-modal="true" aria-label="Detail refleksi"><button type="button" className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button><div className="detail-meta"><span>{selected.category}</span><span>{displayDate(selected.date)}</span>{selected.emotions && <span>· {selected.emotions}</span>}</div><h2>{selected.title}</h2>{[["Apa yang terjadi", selected.event], ["Dampak terhadap diri", selected.impactSelf], ["Dampak terhadap orang lain", selected.impactOthers], ["Bagian tanggung jawabku", selected.ownership], ["Kemungkinan penyebab", selected.rootCause], ["Yang kupelajari", selected.lesson]].filter(([, value]) => value).map(([heading, content]) => <section key={heading}><p className="eyebrow">{heading}</p><p>{content}</p></section>)}{selected.action && <section className="detail-action"><p className="eyebrow">EKSPERIMEN PERILAKU</p><p>{selected.action}</p></section>}</article></div>}

      {privacyOpen && <div className="modal-layer" role="presentation"><button className="modal-backdrop" type="button" onClick={() => setPrivacyOpen(false)} aria-label="Tutup informasi privasi" /><article className="privacy-modal" role="dialog" aria-modal="true" aria-label="Tentang privasi"><button type="button" className="modal-close" onClick={() => setPrivacyOpen(false)}><X size={18} /></button><img src={characterIcon} alt="" /><p className="eyebrow">PRIVASI</p><h2>Ruang ini milikmu.</h2><p>Aplikasi ini tidak memakai akun maupun server. Refleksi, latihan, dan catatan kesehatan disimpan di <i>local storage</i> browser pada perangkat ini.</p><p>Gunakan unduhan data sebagai cadangan. Hindari perangkat umum untuk catatan yang sensitif.</p></article></div>}
    </div>
  );
}
