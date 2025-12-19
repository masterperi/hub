import React from "react";
import { ThemedText } from "./ThemedText";

interface TimeAgoProps {
  timestamp?: string | Date | number;
  date?: string | Date | number;
  type?: "bodySmall" | "caption" | "body";
  secondary?: boolean;
}

function TimeAgo({ timestamp, date, type = "bodySmall", secondary = true }: TimeAgoProps) {
  const dateValue = timestamp || date;
  const getTimeAgo = (date: string | Date | number): string => {
    const now = new Date();
    const pastDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y ago`;
  };

  return (
    <ThemedText type={type} secondary={secondary}>
      {getTimeAgo(dateValue || new Date())}
    </ThemedText>
  );
}

export default TimeAgo;
export { TimeAgo };
