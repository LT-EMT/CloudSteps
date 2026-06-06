import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Modal } from "antd";
import { getTeacherCoachingWeek, type CoachingWeekSchedule } from "@/api/coaching";
import { useAuthStore } from "@/stores/authStore";
import { minutesUntilCoachingEnd } from "@/utils/coachingSchedule";

const REMIND_THRESHOLD_MIN = 10;
const REMIND_EVERY_MS = 3 * 60 * 1000;
const POLL_MS = 30_000;

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

type ReminderModal = {
  open: boolean;
  title: string;
  student: string;
  slot: string;
  minutesLeft: number | null;
  appointmentId: number;
};

/**
 * 老师端全站陪练提醒（含 material-selection 等无 Layout 页面）
 * 仅在剩余 ≤10 分钟时提醒，每 3 分钟一次；到点提示下课
 */
export function CoachingClassReminder() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "";
  // @ts-ignore
  const isCoach = role === "teacher" || role === "user";

  const [modal, setModal] = useState<ReminderModal>({
    open: false,
    title: "",
    student: "",
    slot: "",
    minutesLeft: null,
    appointmentId: 0,
  });

  const lastRemindAtRef = useRef<Record<number, number>>({});
  const endedShownRef = useRef<Set<number>>(new Set());
  const modalOpenRef = useRef(false);

  useEffect(() => {
    modalOpenRef.current = modal.open;
  }, [modal.open]);

  const openReminder = useCallback(
    (payload: Omit<ReminderModal, "open">) => {
      lastRemindAtRef.current[payload.appointmentId] = Date.now();
      setModal({ ...payload, open: true });
    },
    []
  );

  const closeReminder = useCallback(() => {
    setModal((m) => ({ ...m, open: false }));
  }, []);

  useEffect(() => {
    if (!isCoach || !user) return;

    const pickUrgent = (list: CoachingWeekSchedule[]) => {
      let best: { s: CoachingWeekSchedule; mins: number } | null = null;
      for (const s of list) {
        if (s.status !== "in_progress") continue;
        const mins = minutesUntilCoachingEnd(s.scheduledDate, s.endTime);
        if (mins == null) continue;
        if (!best || mins < best.mins) {
          best = { s, mins };
        }
      }
      return best;
    };

    const tick = async () => {
      if (modalOpenRef.current) return;

      try {
        const ref = fmtYMD(new Date());
        const res = await getTeacherCoachingWeek(ref);
        const schedules: CoachingWeekSchedule[] = Array.isArray(res.data?.schedules)
          ? res.data!.schedules!
          : [];

        const urgent = pickUrgent(schedules);
        if (!urgent) return;

        const { s, mins } = urgent;
        const student = s.students?.[0] || s.title || `排课 #${s.id}`;
        const slot = `${s.scheduledDate?.slice(0, 10)} ${s.startTime}–${s.endTime}`;

        if (mins <= 0) {
          if (endedShownRef.current.has(s.id)) return;
          endedShownRef.current.add(s.id);
          openReminder({
            title: "陪练课已结束",
            student,
            slot,
            minutesLeft: 0,
            appointmentId: s.id,
          });
          return;
        }

        // 剩余超过 10 分钟时不提醒
        if (mins > REMIND_THRESHOLD_MIN) return;

        const last = lastRemindAtRef.current[s.id] ?? 0;
        if (Date.now() - last < REMIND_EVERY_MS) return;

        const title = mins <= 5 ? "陪练即将结束" : "陪练下课提醒";
        openReminder({
          title,
          student,
          slot,
          minutesLeft: mins,
          appointmentId: s.id,
        });
      } catch {
        // ignore
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => window.clearInterval(id);
  }, [isCoach, user, openReminder]);

  if (!isCoach || !user) return null;

  const isEnding = modal.minutesLeft != null && modal.minutesLeft > 0;

  return (
    <Modal
      open={modal.open}
      onCancel={closeReminder}
      footer={null}
      centered
      width={400}
      destroyOnClose
      maskClosable
      className="coaching-reminder-modal"
      styles={{
        content: { borderRadius: 16, padding: "24px 24px 20px" },
        body: { padding: 0 },
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-full bg-[#4ECDC4]/15 flex items-center justify-center">
          <Clock className="text-[#4ECDC4]" size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#2D3748] leading-tight">{modal.title}</h3>
          <p className="text-base font-medium text-[#2D3748] mt-3">{modal.student}</p>
          <p className="text-sm text-[#718096] mt-1">{modal.slot}</p>
          {isEnding ? (
            <p className="text-sm text-[#FF9800] font-medium mt-3">
              还剩约 {modal.minutesLeft} 分钟，请准备下课。
            </p>
          ) : (
            <p className="text-sm text-[#718096] mt-3">
              系统已按排课结束时间自动下课并结算（不超过计划时长）。
            </p>
          )}
          {isEnding && (
            <p className="text-xs text-[#A0AEC0] mt-2">
              剩余 10 分钟内每 3 分钟提醒一次。
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={closeReminder}
        className="w-full mt-6 py-3 bg-[#4ECDC4] text-white rounded-full font-medium hover:bg-[#45b8b0] transition-colors"
      >
        知道了
      </button>
    </Modal>
  );
}
