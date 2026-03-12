import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { localDb, insertRecord, generateId } from "@/integrations/local-db";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  Star,
  Users,
  CheckCircle2,
  Activity,
  Stethoscope,
  Timer,
  ChevronRight,
  FileText,
  CreditCard,
  Plus,
  X,
  UserPlus,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const AVG_CONSULTATION_MINS = 15;

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueuedPatient {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  payment_amount: number;
  payment_method: string;
  notes?: string;
  status: string;
  profiles?: { full_name?: string; email?: string };
  queuePosition: number;
  estimatedWaitMins: number;
}

// ─── Queue builder ────────────────────────────────────────────────────────────
function buildQueue(appointments: any[]): QueuedPatient[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const active = appointments
    .filter(
      (a) =>
        a.appointment_date === todayStr &&
        (a.status === "confirmed" || a.status === "pending")
    )
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  return active.map((apt, idx) => ({
    ...apt,
    queuePosition: idx + 1,
    estimatedWaitMins: idx * AVG_CONSULTATION_MINS,
  }));
}

// ─── PatientQueueCard component ───────────────────────────────────────────────
interface PatientQueueCardProps {
  patient: QueuedPatient;
  isCurrent: boolean;
  onMarkComplete: (id: string) => void;
  completing: string | null;
}

const PatientQueueCard = ({
  patient,
  isCurrent,
  onMarkComplete,
  completing,
}: PatientQueueCardProps) => {
  const isCompleting = completing === patient.id;

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-500 overflow-hidden ${
        isCurrent
          ? "border-green-500/40 bg-gradient-to-r from-green-950/40 to-emerald-950/20 shadow-lg shadow-green-900/20"
          : "border-border bg-card hover:border-primary/30 hover:shadow-md"
      }`}
    >
      {/* Animated top bar for current patient */}
      {isCurrent && (
        <div className="h-1 w-full bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 animate-pulse" />
      )}

      <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Queue Position Badge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
              isCurrent
                ? "bg-green-500 text-white shadow-green-500/30"
                : patient.queuePosition === 2
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            #{patient.queuePosition}
          </div>
          {isCurrent && (
            <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider whitespace-nowrap">
              Now
            </span>
          )}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-bold text-base truncate">
              {patient.profiles?.full_name ?? "Patient"}
            </h3>
            {isCurrent && (
              <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs animate-pulse px-2 py-0.5">
                🟢 In Consultation
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {patient.appointment_time}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              {isCurrent ? (
                <span className="text-amber-400 font-medium">
                  Consulting Now
                </span>
              ) : (
                <span>
                  ~{patient.estimatedWaitMins} min wait
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              ${patient.payment_amount} · {patient.payment_method}
            </span>
          </div>

          {patient.notes && (
            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{patient.notes}</span>
            </p>
          )}
        </div>

        {/* Action */}
        <div className="flex-shrink-0 self-center">
          <Button
            size="sm"
            disabled={isCompleting}
            onClick={() => onMarkComplete(patient.id)}
            className={`gap-2 rounded-xl transition-all duration-300 ${
              isCurrent
                ? "bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-500/20"
                : "variant-secondary"
            }`}
          >
            {isCompleting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Complete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  // ── Quick Add Patient dialog state ──────────────────────────────────────
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    appointment_time: new Date().toTimeString().slice(0, 5),
    payment_amount: "500",
    payment_method: "Cash",
    notes: "",
  });
  const [addingPatient, setAddingPatient] = useState(false);

  // ── Derived queue state ──────────────────────────────────────────────────
  const todayQueue = useMemo(() => buildQueue(appointments), [appointments]);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTotal = appointments.filter(
    (a) => a.appointment_date === todayStr
  ).length;
  const completedToday = appointments.filter(
    (a) => a.appointment_date === todayStr && a.status === "completed"
  ).length;

  useEffect(() => {
    checkDoctorAccess();
  }, []);

  const checkDoctorAccess = async () => {
    const {
      data: { session },
    } = await localDb.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const rolesResult = await localDb
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "doctor")
      .single();

    const roleData: any = rolesResult.data;

    if (!roleData || !roleData.doctor_id) {
      toast({
        title: "Access Denied",
        description: "You don't have doctor permissions",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const specResult = await localDb.from("specializations").select("*");
    const specMap = new Map(
      (specResult.data || []).map((s: any) => [s.id, s])
    );

    const { data: doctorData } = await localDb
      .from("doctors")
      .select("*")
      .eq("id", roleData.doctor_id)
      .single();

    if (doctorData && typeof doctorData === "object") {
      const doctorWithSpec = {
        ...doctorData,
        specialization: specMap.get((doctorData as any).specialization_id),
      };
      setDoctorInfo(doctorWithSpec);
      fetchAppointments(roleData.doctor_id);
    }
  };

  const fetchAppointments = async (doctorId: string) => {
    setLoading(true);
    const profilesResult = await localDb.from("profiles").select("*");
    const profileMap = new Map(
      (profilesResult.data || []).map((p: any) => [p.id, p])
    );

    const { data } = await localDb
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (data) {
      const appointmentsWithProfiles = (data as any[]).map((apt: any) => ({
        ...apt,
        profiles: profileMap.get(apt.patient_id),
      }));
      setAppointments(appointmentsWithProfiles);
    }
    setLoading(false);
  };

  // ── Quick Add Patient handler ────────────────────────────────────────────
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim()) return;
    setAddingPatient(true);

    const todayDate = new Date().toISOString().split("T")[0];

    // Create a guest patient profile
    const patientId = generateId();
    insertRecord("profiles", {
      id: patientId,
      full_name: addForm.full_name.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Insert the appointment
    insertRecord("appointments", {
      doctor_id: doctorInfo.id,
      patient_id: patientId,
      appointment_date: todayDate,
      appointment_time: addForm.appointment_time,
      status: "confirmed",
      payment_amount: parseInt(addForm.payment_amount) || 0,
      payment_method: addForm.payment_method,
      notes: addForm.notes,
      created_at: new Date().toISOString(),
    });

    toast({
      title: "Patient Added ✓",
      description: `${addForm.full_name} has been added to today's queue.`,
    });

    // Reset form & close
    setAddForm({
      full_name: "",
      appointment_time: new Date().toTimeString().slice(0, 5),
      payment_amount: "500",
      payment_method: "Cash",
      notes: "",
    });
    setShowAddPatient(false);
    setAddingPatient(false);

    // Refresh
    await fetchAppointments(doctorInfo.id);
  };

  // ── Mark consultation complete ───────────────────────────────────────────
  const markConsultationComplete = async (id: string) => {
    setCompleting(id);
    const { error } = await localDb
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Consultation Complete ✓",
        description: "Patient removed from queue. Next patient promoted.",
      });
      if (doctorInfo) await fetchAppointments(doctorInfo.id);
    }
    setCompleting(null);
  };

  // ── Generic status update (for other tabs) ───────────────────────────────
  const updateAppointmentStatus = async (
    id: string,
    status: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    const { error } = await localDb
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: `Appointment ${status}` });
      if (doctorInfo) fetchAppointments(doctorInfo.id);
    }
  };

  const filterAppointments = (status: string) =>
    appointments.filter((apt) => apt.status === status);

  if (loading || !doctorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <Stethoscope className="absolute inset-0 m-auto w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Dr. {doctorInfo.name}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => localDb.auth.signOut().then(() => navigate("/"))}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ── Quick Add Patient Modal ── */}
        {showAddPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddPatient(false)}
            />
            <div className="relative z-10 w-full max-w-md bg-card border rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Add Patient to Queue</h2>
                    <p className="text-xs text-muted-foreground">Adds to today's confirmed queue</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddPatient(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Patient Name <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    value={addForm.full_name}
                    onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium mb-1">Appointment Time</label>
                  <input
                    type="time"
                    value={addForm.appointment_time}
                    onChange={e => setAddForm(f => ({ ...f, appointment_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Payment row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fee ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={addForm.payment_amount}
                      onChange={e => setAddForm(f => ({ ...f, payment_amount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method</label>
                    <select
                      value={addForm.payment_method}
                      onChange={e => setAddForm(f => ({ ...f, payment_method: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Insurance</option>
                      <option>Online</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <textarea
                    placeholder="Symptoms, reason for visit…"
                    rows={2}
                    value={addForm.notes}
                    onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddPatient(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={addingPatient || !addForm.full_name.trim()}
                  >
                    {addingPatient ? (
                      <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Adding…</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" /> Add to Queue</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold mb-1">Doctor Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {doctorInfo.specialization?.name ?? "General"} ·{" "}
              {doctorInfo.qualification}
            </p>
          </div>
          <Button
            onClick={() => setShowAddPatient(true)}
            className="gap-2 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {/* Today's Queue */}
          <Card className="col-span-2 md:col-span-1 p-5 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayQueue.length}</p>
                <p className="text-xs text-muted-foreground">In Queue Today</p>
              </div>
            </div>
          </Card>

          {/* Total */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>

          {/* Pending */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filterAppointments("pending").length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>

          {/* Completed today */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedToday}</p>
                <p className="text-xs text-muted-foreground">Done Today</p>
              </div>
            </div>
          </Card>

          {/* Rating */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/10">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctorInfo.rating}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl mb-6">
            <TabsTrigger value="queue" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Today's Queue
              {todayQueue.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {todayQueue.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* ── TODAY'S QUEUE TAB ── */}
          <TabsContent value="queue" className="mt-0">
            {todayQueue.length === 0 ? (
              <Card className="p-16 text-center border-dashed">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-lg">No patients in queue</p>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Confirm pending appointments to populate today's queue.
    Patients will appear here in chronological order.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Queue summary banner */}
                <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 px-5 py-3 flex flex-wrap gap-4 items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>{todayQueue.length} patient{todayQueue.length !== 1 ? "s" : ""} in queue</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      Est. {todayQueue.length * AVG_CONSULTATION_MINS} min total
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    ~{AVG_CONSULTATION_MINS} min per patient
                  </Badge>
                </div>

                {todayQueue.map((patient, idx) => (
                  <PatientQueueCard
                    key={patient.id}
                    patient={patient}
                    isCurrent={idx === 0}
                    onMarkComplete={markConsultationComplete}
                    completing={completing}
                  />
                ))}

                {/* Workflow explanation card */}
                <Card className="mt-6 p-5 border-dashed bg-muted/30">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" /> Queue Workflow
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3 text-xs text-muted-foreground">
                    {[
                      { step: "1", label: "Patient checks in", icon: "👤" },
                      { step: "2", label: "Doctor consults #1", icon: "🩺" },
                      { step: "3", label: "Click Mark Complete", icon: "✓" },
                      { step: "4", label: "Queue auto-updates", icon: "🔄" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-2 flex-1">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <span className="text-[10px] text-primary font-bold">
                            Step {item.step}
                          </span>
                          <p>{item.label}</p>
                        </div>
                        {item.step !== "4" && (
                          <ChevronRight className="w-3 h-3 hidden sm:block ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── PENDING TAB ── */}
          <TabsContent value="pending" className="mt-0">
            <div className="space-y-4">
              {filterAppointments("pending").map((apt) => (
                <Card key={apt.id} className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2">
                        {apt.profiles?.full_name ?? "Patient"}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {apt.appointment_date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {apt.appointment_time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          ${apt.payment_amount} · {apt.payment_method}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <strong>Notes:</strong> {apt.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() =>
                          updateAppointmentStatus(apt.id, "confirmed")
                        }
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          updateAppointmentStatus(apt.id, "cancelled")
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {filterAppointments("pending").length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No pending appointments</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── CONFIRMED TAB ── */}
          <TabsContent value="confirmed" className="mt-0">
            <div className="space-y-4">
              {filterAppointments("confirmed").map((apt) => (
                <Card key={apt.id} className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2">
                        {apt.profiles?.full_name ?? "Patient"}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {apt.appointment_date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {apt.appointment_time}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <strong>Notes:</strong> {apt.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() =>
                        updateAppointmentStatus(apt.id, "completed")
                      }
                    >
                      Mark Complete
                    </Button>
                  </div>
                </Card>
              ))}
              {filterAppointments("confirmed").length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No confirmed appointments
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── COMPLETED TAB ── */}
          <TabsContent value="completed" className="mt-0">
            <div className="space-y-4">
              {filterAppointments("completed").map((apt) => (
                <Card
                  key={apt.id}
                  className="p-6 border-green-500/15 bg-green-950/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          {apt.profiles?.full_name ?? "Patient"}
                        </h3>
                        <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs">
                          ✓ Completed
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {apt.appointment_date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {apt.appointment_time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {apt.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {filterAppointments("completed").length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No completed appointments yet
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;