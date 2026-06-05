import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Modal } from "antd";

interface DatePickerModalProps {
  open: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
}

const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_ZH = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

function parseYMD(ymd: string): { year: number; month: number; day: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function DatePickerModal({ open, onClose, value, onChange }: DatePickerModalProps) {
  const [displayYear, setDisplayYear] = useState(() => parseYMD(value).year);
  const [displayMonth, setDisplayMonth] = useState(() => parseYMD(value).month);
  const { year: selectedYear, month: selectedMonth, day: selectedDay } = parseYMD(value);

  const daysInMonth = useMemo(() => getDaysInMonth(displayYear, displayMonth), [displayYear, displayMonth]);
  const firstDayOfMonth = useMemo(() => getFirstDayOfMonth(displayYear, displayMonth), [displayYear, displayMonth]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    // 填充前面的空白
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const handlePrevMonth = () => {
    if (displayMonth === 1) {
      setDisplayYear(displayYear - 1);
      setDisplayMonth(12);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayYear(displayYear + 1);
      setDisplayMonth(1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = formatYMD(displayYear, displayMonth, day);
    onChange(newDate);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const newDate = formatYMD(year, month, day);
    onChange(newDate);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={320}
      styles={{ body: { padding: "0" } }}
      bodyStyle={{ borderRadius: "16px" }}
    >
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* 月份导航 */}
        <div className="bg-gradient-to-r from-[#4ECDC4] to-[#55A3FF] px-6 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {displayYear}年{displayMonth}月
              </div>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 日历 */}
        <div className="p-6">
          {/* 星期行 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {WEEKDAY_ZH.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-[#718096] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {calendarDays.map((day, idx) => {
              const isSelected =
                day !== null &&
                day === selectedDay &&
                displayYear === selectedYear &&
                displayMonth === selectedMonth;
              const isToday =
                day !== null &&
                day === new Date().getDate() &&
                displayYear === new Date().getFullYear() &&
                displayMonth === new Date().getMonth() + 1;

              return (
                <button
                  key={idx}
                  onClick={() => day !== null && handleSelectDay(day)}
                  disabled={day === null}
                  className={`
                    aspect-square rounded-lg text-sm font-medium transition-all
                    ${day === null ? "cursor-default" : "cursor-pointer"}
                    ${
                      isSelected
                        ? "bg-[#4ECDC4] text-white font-bold"
                        : isToday
                          ? "bg-[#4ECDC4]/20 text-[#4ECDC4] border border-[#4ECDC4]"
                          : "text-[#2D3748] hover:bg-[#F7F9FC]"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <Button onClick={handleToday} className="flex-1">
              今天
            </Button>
            <Button onClick={onClose} type="primary" className="flex-1">
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
