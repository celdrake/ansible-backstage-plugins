import {
  DeviceUpdatePolicySpec,
  UpdateSchedule,
} from '@ansible/portal-edge-fleets-poc-common';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseCronField = (
  field: string,
  min: number,
  max: number,
): number[] | undefined => {
  const values = new Set<number>();

  for (const part of field.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) {
      return undefined;
    }

    const [, range, stepText] = match;
    const step = stepText ? Number(stepText) : 1;
    if (!Number.isSafeInteger(step) || step < 1) {
      return undefined;
    }

    let start = min;
    let end = max;
    if (range !== '*') {
      const rangeParts = range.split('-').map(Number);
      start = rangeParts[0];
      end = rangeParts[1] ?? start;
      if (stepText && rangeParts.length === 1) {
        end = max;
      }
    }

    if (start < min || end > max || start > end) {
      return undefined;
    }

    for (let value = start; value <= end; value += step) {
      values.add(value);
    }
  }

  return values.size > 0 ? [...values].sort((a, b) => a - b) : undefined;
};

const formatTime = (minutesSinceMidnight: number): string => {
  const hours = Math.floor(minutesSinceMidnight / 60);
  const minutes = minutesSinceMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}`;
};

const getDurationInMinutes = (duration: string): number | undefined => {
  const match = /^(\d+)([smh])$/.exec(duration);
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount)) {
    return undefined;
  }

  switch (match[2]) {
    case 's':
      return Math.round(amount / 60);
    case 'm':
      return amount;
    case 'h':
      return amount * 60;
    default:
      return undefined;
  }
};

const getScheduleTimeZone = (schedule: UpdateSchedule): string => {
  if (!schedule.timeZone || schedule.timeZone === 'Local') {
    return "device's local timezone";
  }
  return schedule.timeZone;
};

type MaintenanceWindow = {
  startMinutes: number;
  endMinutes: number;
  daysOfWeek: number[];
};

const scheduleToWindow = (
  schedule: UpdateSchedule,
): MaintenanceWindow | undefined => {
  const cronParts = schedule.at.trim().split(/\s+/);
  if (cronParts.length !== 5) {
    return undefined;
  }

  const [minuteField, hourField, dayOfMonth, month, dayOfWeekField] = cronParts;
  const minutes = parseCronField(minuteField, 0, 59);
  const hours = parseCronField(hourField, 0, 23);
  const daysOfWeek = parseCronField(dayOfWeekField, 0, 6);
  const duration = getDurationInMinutes(schedule.startGraceDuration);

  // Online display a user-friendly window for simplified cron expressions.
  if (
    dayOfMonth !== '*' ||
    month !== '*' ||
    !minutes ||
    minutes.length !== 1 ||
    !hours ||
    hours.length !== 1 ||
    !daysOfWeek ||
    duration === undefined
  ) {
    return undefined;
  }

  const startMinutes = hours[0] * 60 + minutes[0];
  const endMinutes = (startMinutes + duration) % (24 * 60);
  return {
    startMinutes,
    endMinutes,
    daysOfWeek,
  };
};

export const hasSameDownloadAndInstallSchedules = (
  updatePolicy: DeviceUpdatePolicySpec,
): boolean => {
  const downloadSchedule = updatePolicy.downloadSchedule;
  const installSchedule = updatePolicy.updateSchedule;
  if (!downloadSchedule || !installSchedule) {
    return false;
  }
  return (
    downloadSchedule.at === installSchedule.at &&
    downloadSchedule.startGraceDuration ===
      installSchedule.startGraceDuration &&
    downloadSchedule.timeZone === installSchedule.timeZone
  );
};

export const formatUpdateSchedule = (
  schedule: UpdateSchedule,
): string | null => {
  const timeZone = getScheduleTimeZone(schedule);
  const cronExpressionParts = scheduleToWindow(schedule);
  if (cronExpressionParts === undefined) {
    return null;
  }

  const { startMinutes, endMinutes, daysOfWeek } = cronExpressionParts;
  const scheduleDays =
    daysOfWeek.length === WEEKDAYS.length
      ? 'Daily'
      : `Weekly on ${daysOfWeek.map(day => WEEKDAYS[day]).join(', ')}`;

  return `${scheduleDays} from ${formatTime(startMinutes)} to ${formatTime(
    endMinutes,
  )} (${timeZone}). Start grace: ${schedule.startGraceDuration}`;
};
