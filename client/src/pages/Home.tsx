/**
 * Style reminder — Pocket Field Notes: an asymmetric, warm editorial journal.
 * Use Coral Bloom, moss ink, paper surfaces, handwritten accents, and gentle motion.
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
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

type Page = "dashboard" | "capture" | "reflections" | "practice" | "health" | "review";
type Outcome = "berhasil" | "sebagian" | "belum";

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
type AppData = {
  reflections: Reflection[];
  practiceLogs: Record<string, Outcome>;
  healthCheckins: Record<string, HealthCheckin>;
  routines: Record<string, boolean>;
  foodEntries: FoodEntry[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "ruang-tumbuh-pwa-v2";
const characterIcon = "/manus-storage/ruang_tumbuh_icons_512_c29cd8f9.png";
const heroImage = "/manus-storage/ruang-tumbuh-hero_f37dd730.png";
const journalTexture = "/manus-storage/ruang-tumbuh-journal-texture_e33bf21c.png";
const emptyStateImage = "/manus-storage/ruang-tumbuh-empty-state_6236e615.png";
const logoMark = "/manus-storage/ruang-tumbuh-logo_c327dcaa.png";

const pageInfo: Record<Page, { label: string; title: string; prompt: string }> = {
  dashboard: { label: "Beranda", title: "Selamat datang", prompt: "Satu langkah pada satu waktu." },
  capture: { label: "Catat kejadian", title: "Mulai dari fakta", prompt: "Apa yang benar-benar terjadi hari ini?" },
  reflections: { label: "Refleksi", title: "Yang sedang kamu pelajari", prompt: "Temukan pola, bukan alasan untuk menghukum diri." },
  practice: { label: "Latihan", title: "Langkah kecilmu", prompt: "Perubahan terbentuk dari pengulangan kecil." },
  health: { label: "Kesehatan", title: "Dukung tubuhmu", prompt: "Data tubuh adalah isyarat, bukan penilaian." },
  review: { label: "Tinjauan", title: "Lihat pola minggu ini", prompt: "Perbaiki sistemnya dengan rasa ingin tahu." },
};

const navItems: { id: Page; icon: typeof HomeIcon }[] = [
  { id: "dashboard", icon: HomeIcon },
  { id: "capture", icon: CirclePlus },
  { id: "reflections", icon: BookOpenText },
  { id: "practice", icon: Sparkles },
  { id: "health", icon: HeartPulse },
  { id: "review", icon: BarChart3 },
];

const routineItems = [
  { id: "water", icon: "◌", label: "Isi ulang botol minum", note: "Hidrasi" },
  { id: "pause", icon: "⌁", label: "Ambil jeda tiga menit", note: "Pemulihan" },
  { id: "move", icon: "↗", label: "Gerakkan tubuh dengan nyaman", note: "Gerak" },
  { id: "night", icon: "☾", label: "Beri ruang untuk beristirahat", note: "Istirahat" },
];

const categories = ["Kerja", "Kuliah", "Komunikasi", "Hubungan", "Kesehatan", "Diri sendiri", "Lainnya"];

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
  return { reflections: [], practiceLogs: {}, healthCheckins: {}, routines: {}, foodEntries: [] };
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
      foodEntries: Array.isArray(source.foodEntries) ? source.foodEntries : [],
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

export default function Home() {
  const [page, setPage] = useState<Page>(() => {
    const requestedView = new URLSearchParams(window.location.search).get("view");
    return navItems.some(item => item.id === requestedView) ? requestedView as Page : "dashboard";
  });
  const [data, setData] = useState<AppData>(() => loadData());
  const [filter, setFilter] = useState("Semua");
  const [selected, setSelected] = useState<Reflection | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
  const routinesDone = routineItems.filter(item => data.routines[`${today}-${item.id}`]).length;
  const activeCategories = ["Semua", ...Array.from(new Set(data.reflections.map(item => item.category)))];
  const todayFoodEntries = useMemo(() => data.foodEntries.filter(entry => entry.date === today), [data.foodEntries, today]);
  const nutritionTotals = useMemo(() => todayFoodEntries.reduce((total, entry) => ({
    kcal: total.kcal + entry.kcal,
    carbs: total.carbs + entry.carbs,
    protein: total.protein + entry.protein,
    fat: total.fat + entry.fat,
  }), { kcal: 0, carbs: 0, protein: 0, fat: 0 }), [todayFoodEntries]);

  function goTo(next: Page) {
    setPage(next);
    setMenuOpen(false);
    window.history.replaceState({}, "", next === "dashboard" ? "/" : `/?view=${next}`);
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
    goTo(entry.action ? "practice" : "reflections");
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
    event.currentTarget.reset();
    toast.success("Catatan makanan atau minuman ditambahkan.");
  }

  function deleteFoodEntry(entryId: string) {
    updateData(previous => ({ ...previous, foodEntries: previous.foodEntries.filter(entry => entry.id !== entryId) }));
    toast.success("Catatan nutrisi dihapus.");
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
          foodEntries: Array.isArray(source.foodEntries) ? source.foodEntries : [],
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
            <div className="stats-row"><StatCard value={data.reflections.length} label="kejadian dicatat" tone="pink" /><StatCard value={practices.length} label="latihan aktif" tone="green" /><StatCard value={`${routinesDone}/${routineItems.length}`} label="ritual kecil hari ini" tone="yellow" /><StatCard value={dueReviews} label="tinjauan yang menunggu" /></div>
          </section>

          <section className="dashboard-notes">
            <article className="active-practice panel-paper"><div className="panel-head"><div><p className="eyebrow">LANGKAH BERIKUTNYA</p><h2>Latihan aktif</h2></div><button type="button" className="round-link" onClick={() => goTo("practice")} aria-label="Buka latihan"><ArrowRight size={18} /></button></div>
              {practices.length ? <div className="practice-preview">{practices.slice(0, 2).map(item => <div key={item.id}><span>Eksperimen</span><h3>{item.title}</h3><p>{item.action}</p></div>)}</div> : <div className="empty-inline"><img src={emptyStateImage} alt="" /><div><h3>Belum ada latihan aktif</h3><p>Setelah mencatat, pilih satu tindakan kecil yang dapat kamu coba.</p><button type="button" className="text-button" onClick={() => goTo("capture")}>Catat kejadian <ArrowRight size={14} /></button></div></div>}
            </article>
            <aside className="note-card"><span className="note-pin">✦</span><p className="eyebrow">PENGINGAT LEMBUT</p><blockquote>“Tanggung jawab bukan tentang menyalahkan diri; melainkan mengurus bagian yang memang menjadi bagianmu.”</blockquote><small>— untuk dirimu hari ini</small></aside>
          </section>

          <section className="section-block journal-section"><div className="section-title"><div><p className="eyebrow">CATATAN TERBARU</p><h2>Yang sedang kamu pelajari</h2></div><button type="button" className="text-button" onClick={() => goTo("reflections")}>Lihat semua <ChevronRight size={16} /></button></div>
            {recentReflections.length ? <div className="reflection-grid">{recentReflections.slice(0, 3).map(entry => <ReflectionCard key={entry.id} entry={entry} onOpen={() => setSelected(entry)} />)}</div> : <div className="starter-note"><img src={characterIcon} alt="" /><div><p className="eyebrow">HALAMAN PERTAMA</p><h3>Mulai dari satu hal yang ingin kamu pahami.</h3><p>Tidak perlu sempurna. Cukup tulis fakta yang sedang ada di depanmu.</p><button type="button" className="primary-button primary-button--small" onClick={() => goTo("capture")}>Buka halaman kosong <ArrowRight size={15} /></button></div></div>}
          </section>
        </section>}

        {page === "capture" && <section className="page page--active capture-page"><PageHeading eyebrow="CATAT KEJADIAN" title="Mulai dari fakta, bukan vonis." description="Tuliskan apa yang terjadi dengan jujur dan ringkas. Kamu dapat melengkapi refleksinya sekarang atau kapan pun nanti." />
          <form className="reflection-form" onSubmit={saveReflection}>
            <fieldset className="form-section"><legend><span>01</span><div><h3>Apa yang terjadi?</h3><p>Fakta yang bisa diamati, tanpa menempelkan vonis pada dirimu.</p></div></legend><div className="form-grid form-grid--two"><label>Judul singkat<input required name="title" maxLength={90} placeholder="Contoh: Terlambat mengirim bagian tugas" /></label><label>Tanggal kejadian<input required name="date" type="date" defaultValue={today} /></label><label>Kategori<select name="category">{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Emosi yang terasa<input name="emotions" maxLength={100} placeholder="Contoh: cemas, malu, defensif" /></label></div><label>Apa yang terjadi?<textarea required name="event" rows={5} placeholder="Contoh: Aku baru mulai mengerjakan pukul 18.00, padahal deadline-nya malam ini." /></label></fieldset>
            <fieldset className="form-section"><legend><span>02</span><div><h3>Lihat dampak dan bagianmu</h3><p>Bertanggung jawab secara proporsional: bukan mengambil semua beban, bukan juga melemparnya.</p></div></legend><div className="form-grid form-grid--two"><label>Dampak terhadap diri<textarea name="impactSelf" rows={4} placeholder="Apa dampaknya pada dirimu?" /></label><label>Dampak terhadap orang lain/pekerjaan<textarea name="impactOthers" rows={4} placeholder="Siapa atau apa yang ikut terdampak?" /></label></div><label>Bagian yang menjadi tanggung jawabku<textarea name="ownership" rows={4} placeholder="Apa yang berada dalam kendalimu dan bisa kamu akui tanpa menyalahkan diri berlebihan?" /></label></fieldset>
            <fieldset className="form-section form-section--coral"><legend><span>03</span><div><h3>Ambil pelajaran dan buat eksperimen</h3><p>Ubah refleksi menjadi perilaku kecil yang bisa dilihat dan diuji.</p></div></legend><div className="form-grid form-grid--two"><label>Kemungkinan penyebab akar<textarea name="rootCause" rows={4} placeholder="Contoh: Aku memperkirakan waktu terlalu optimistis." /></label><label>Yang kupelajari tentang diriku<textarea name="lesson" rows={4} placeholder="Contoh: Aku cenderung menunda saat tugas terasa besar." /></label></div><label>Eksperimen perilaku baru<textarea name="action" rows={4} placeholder="Contoh: Begitu tugas diberikan, aku akan mengerjakannya minimal 30 menit pada hari yang sama." /></label><div className="form-grid form-grid--two form-grid--narrow"><label>Mulai latihan<input type="date" name="actionStart" defaultValue={today} /></label><label>Tinjau kembali<input type="date" name="reviewDate" /></label></div></fieldset>
            <div className="form-actions"><p><ShieldCheck size={16} /> Data ini hanya disimpan di browser perangkat ini.</p><button className="primary-button" type="submit">Simpan refleksi <ArrowRight size={17} /></button></div>
          </form>
        </section>}

        {page === "reflections" && <section className="page page--active"><PageHeading eyebrow="REFLEKSI" title="Temukan pola, bukan alasan untuk menghukum diri." description="Kumpulkan pelajaran dari kejadian-kejadian kecil, lalu buka lagi saat kamu perlu melihat arah." action={<button type="button" className="primary-button" onClick={() => goTo("capture")}><Plus size={16} /> Catat baru</button>} />
          <div className="filter-row">{activeCategories.map(category => <button type="button" key={category} className={filter === category ? "filter-chip filter-chip--active" : "filter-chip"} onClick={() => setFilter(category)}>{category}</button>)}</div>
          {recentReflections.filter(entry => filter === "Semua" || entry.category === filter).length ? <div className="reflection-grid reflection-grid--full">{recentReflections.filter(entry => filter === "Semua" || entry.category === filter).map(entry => <ReflectionCard key={entry.id} entry={entry} onOpen={() => setSelected(entry)} />)}</div> : <div className="empty-page"><img src={emptyStateImage} alt="" /><h3>Belum ada catatan di sini.</h3><p>Mulai dengan satu kejadian yang ingin kamu pahami.</p><button type="button" className="text-button" onClick={() => goTo("capture")}>Catat kejadian <ArrowRight size={14} /></button></div>}
        </section>}

        {page === "practice" && <section className="page page--active"><PageHeading eyebrow="LATIHAN HARIAN" title="Buktikan perubahan melalui langkah kecil." description="Nilai ini bukan rapor tentang dirimu. Ia adalah informasi agar eksperimenmu dapat diperbaiki." />
          {practices.length ? <div className="practice-list">{practices.map(entry => { const outcome = data.practiceLogs[`${today}-${entry.id}`]; return <article className="practice-card" key={entry.id}><div className="practice-content"><div className="practice-date"><CalendarDays size={15} /> Eksperimen sejak {displayDate(entry.actionStart || entry.date)}</div><h3>{entry.title}</h3><p>{entry.action}</p></div><div className="outcome-list"><span>Hari ini terasa…</span><div>{(["berhasil", "sebagian", "belum"] as Outcome[]).map(item => <button key={item} type="button" className={outcome === item ? `outcome-button outcome-button--${item} outcome-button--selected` : `outcome-button outcome-button--${item}`} onClick={() => logPractice(entry.id, item)}>{item === "berhasil" ? <Check size={15} /> : item === "sebagian" ? <MoreHorizontal size={16} /> : <X size={15} />}{item === "berhasil" ? "Berhasil" : item === "sebagian" ? "Sebagian" : "Belum"}</button>)}</div></div></article>; })}</div> : <div className="empty-page empty-page--large"><img src={characterIcon} alt="" /><p className="eyebrow">LANGKAH PERTAMA</p><h3>Belum ada latihan aktif.</h3><p>Di akhir refleksi, tuliskan satu perubahan perilaku yang ingin kamu coba.</p><button type="button" className="primary-button" onClick={() => goTo("capture")}>Catat kejadian <ArrowRight size={16} /></button></div>}
        </section>}

        {page === "health" && <section className="page page--active"><PageHeading eyebrow="CHECK-IN KESEHATAN" title="Rawat tubuh sebagai bagian dari pertumbuhanmu." description="Catat yang berguna bagimu. Pelacak ini membantu pengamatan pribadi, bukan pengganti nasihat tenaga kesehatan." />
          <section className="health-overview"><article className="health-summary"><p className="eyebrow">HARI INI · {displayDate(today)}</p><h3>{currentCheckin.sleep ? `${currentCheckin.sleep} jam tidur` : "Belum ada check-in"}</h3><div className="health-tags">{currentCheckin.energy && <span><Sun size={14} /> Energi {currentCheckin.energy}/5</span>}{currentCheckin.mood && <span><HeartPulse size={14} /> Mood {currentCheckin.mood}/5</span>}{currentCheckin.water && <span>◌ {currentCheckin.water} gelas air</span>}</div><p>{currentCheckin.note || "Dengarkan tubuhmu tanpa harus mengubahnya menjadi target."}</p></article><aside className="health-quote"><Moon size={22} /><blockquote>“Perawatan yang konsisten tidak harus rumit. Pilih yang bisa kamu lakukan lagi besok.”</blockquote></aside></section>
          <form className="health-form panel-paper" onSubmit={saveHealth}><div className="panel-head"><div><p className="eyebrow">CHECK-IN TUBUH</p><h2>Bagaimana keadaanmu hari ini?</h2></div><span className="date-stamp">hari ini</span></div><div className="health-fields"><label>Tidur (jam)<input type="number" name="sleep" min="0" max="24" step="0.5" defaultValue={currentCheckin.sleep} placeholder="mis. 7,5" /></label><label>Energi (1–5)<select name="energy" defaultValue={currentCheckin.energy}><option value="">Pilih</option>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label><label>Suasana hati (1–5)<select name="mood" defaultValue={currentCheckin.mood}><option value="">Pilih</option>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label><label>Air minum (gelas)<input type="number" name="water" min="0" max="50" defaultValue={currentCheckin.water} placeholder="mis. 6" /></label><label>Gerak (menit)<input type="number" name="movement" min="0" max="1440" defaultValue={currentCheckin.movement} placeholder="mis. 30" /></label></div><label>Catatan tubuh hari ini<textarea name="note" rows={3} defaultValue={currentCheckin.note} placeholder="Contoh: Bahu terasa tegang setelah duduk lama; berjalan sore membuatku lebih tenang." /></label><div className="form-actions"><p>Hanya catat yang membantumu melihat pola.</p><button type="submit" className="primary-button">Simpan check-in <ArrowRight size={17} /></button></div></form>
          <section className="routine-section"><div className="section-title"><div><p className="eyebrow">RITUAL KECIL HARI INI</p><h2>Yang cukup untuk dirimu</h2></div><strong className="routine-count">{routinesDone}/{routineItems.length}</strong></div><div className="routine-grid">{routineItems.map(item => { const done = data.routines[`${today}-${item.id}`]; return <button type="button" key={item.id} onClick={() => toggleRoutine(item.id)} className={done ? "routine-card routine-card--done" : "routine-card"}><span className="routine-icon">{done ? <Check size={18} /> : item.icon}</span><small>{item.note}</small><strong>{item.label}</strong></button>; })}</div></section>
          <section className="nutrition-section"><div className="section-title"><div><p className="eyebrow">TRACKER MAKAN & MINUM</p><h2>Kenali asupanmu, dengan netral</h2></div><span className="entry-count"><Coffee size={16} /> {todayFoodEntries.length} catatan hari ini</span></div>
            <div className="nutrition-overview"><article className="nutrition-kcal"><div><p className="eyebrow">TOTAL HARI INI</p><strong>{nutritionTotals.kcal.toLocaleString("id-ID")} <small>kcal</small></strong><p>Diinput mandiri, tanpa target atau penilaian.</p></div><span><UtensilsGlyph /></span></article><div className="macro-grid"><article><span>Karbohidrat</span><strong>{nutritionTotals.carbs.toLocaleString("id-ID")}<small>g</small></strong><i className="macro-bar macro-bar--carbs" /></article><article><span>Protein</span><strong>{nutritionTotals.protein.toLocaleString("id-ID")}<small>g</small></strong><i className="macro-bar macro-bar--protein" /></article><article><span>Lemak</span><strong>{nutritionTotals.fat.toLocaleString("id-ID")}<small>g</small></strong><i className="macro-bar macro-bar--fat" /></article></div></div>
            <div className="nutrition-workspace"><form className="nutrition-form panel-paper" onSubmit={addFoodEntry}><div className="panel-head"><div><p className="eyebrow">TAMBAH CATATAN MANUAL</p><h2>Makan atau minum apa?</h2></div><span className="date-stamp">{shortDate(today)}</span></div><p className="form-intro">Masukkan angka yang kamu ketahui atau ingin catat sendiri. Semua kolom nutrisi bersifat opsional.</p><div className="nutrition-primary-fields"><label>Jenis konsumsi<select name="type" defaultValue="Makanan"><option>Makanan</option><option>Minuman</option></select></label><label>Waktu konsumsi<select name="meal" defaultValue="Sarapan"><option>Sarapan</option><option>Makan siang</option><option>Makan malam</option><option>Camilan</option><option>Minuman</option><option>Lainnya</option></select></label><label className="food-name-field">Nama makanan/minuman<input required name="name" maxLength={100} placeholder="Contoh: Nasi, ayam, dan sayur" /></label></div><div className="macro-input-grid"><label>Kalori (kcal)<input name="kcal" type="number" min="0" step="1" inputMode="numeric" placeholder="0" /></label><label>Karbohidrat (g)<input name="carbs" type="number" min="0" step="0.1" inputMode="decimal" placeholder="0" /></label><label>Protein (g)<input name="protein" type="number" min="0" step="0.1" inputMode="decimal" placeholder="0" /></label><label>Lemak (g)<input name="fat" type="number" min="0" step="0.1" inputMode="decimal" placeholder="0" /></label></div><div className="nutrition-actions"><p><GlassWater size={16} /> Data dicatat secara lokal di perangkat ini.</p><button type="submit" className="primary-button"><Plus size={16} /> Tambahkan</button></div></form>
              <article className="food-log panel-paper"><div className="panel-head"><div><p className="eyebrow">CATATAN HARI INI</p><h2>Makan & minum</h2></div><span className="food-log-mark">✦</span></div>{todayFoodEntries.length ? <div className="food-log-list">{todayFoodEntries.map(entry => <article key={entry.id} className="food-log-entry"><div className={entry.type === "Minuman" ? "food-type food-type--drink" : "food-type"}>{entry.type === "Minuman" ? <GlassWater size={15} /> : <UtensilsGlyph size={15} />}</div><div className="food-entry-copy"><div><span>{entry.meal}</span><h3>{entry.name}</h3></div><p><strong>{entry.kcal} kcal</strong><span>· {entry.carbs}g karbo</span><span>· {entry.protein}g protein</span><span>· {entry.fat}g lemak</span></p></div><button type="button" className="entry-delete" onClick={() => deleteFoodEntry(entry.id)} aria-label={`Hapus ${entry.name}`}><Trash2 size={16} /></button></article>)}</div> : <div className="food-log-empty"><img src={emptyStateImage} alt="" /><p>Belum ada makanan atau minuman yang dicatat hari ini.</p></div>}</article></div>
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
