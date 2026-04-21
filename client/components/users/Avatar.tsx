import React from "react";
import { AVATAR_COLORS, getInitials } from "./userUtils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ name, size = "sm" }: AvatarProps) {
  const { bg, text } = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  const sz = { 
    sm: "w-7 h-7 text-xs", 
    md: "w-9 h-9 text-sm", 
    lg: "w-14 h-14 text-xl font-bold" 
  }[size];

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${bg} ${text} ${sz}`}>
      {getInitials(name)}
    </span>
  );
}
