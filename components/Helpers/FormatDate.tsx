import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format } from "date-fns";
import { Timestamp } from "firebase/firestore";

export function formatDate(created_at: Timestamp, isWeird?: boolean): string {
    let date: Date;
    if (isWeird) {
      const milliseconds = created_at.seconds * 1000 + created_at.nanoseconds / 1000000;
      date = new Date(milliseconds);
    } else {
      date = created_at ? created_at.toDate() : new Date();
    }
    return getDate(date);
}

export function getDate(date: Date) {
    const now = new Date();
    
    const secondsAgo = differenceInSeconds(now, date);
    const minutesAgo = differenceInMinutes(now, date);
    const hoursAgo = differenceInHours(now, date);
    const daysAgo = differenceInDays(now, date);
    if (secondsAgo < 60) {
      return `${secondsAgo} ${secondsAgo > 1 ? "seconds" : "second"} ago`;
    } else if (minutesAgo < 60) {
      return `${minutesAgo} ${minutesAgo > 1 ? "minutes" : "minute"} ago`;
    } else if (hoursAgo < 24) {
      return `${hoursAgo} ${hoursAgo > 1 ? "hours" : "hour"} ago`;
    } else if (daysAgo < 7) {
      return `${daysAgo} ${daysAgo > 1 ? "days" : "day"} ago`;
    } else {
      return format(date, 'PP');
    }
}