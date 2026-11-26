import React from 'react';
import {
  Briefcase,
  Car,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  PiggyBank,
  PlusCircle,
  Receipt,
  ShoppingBag,
  Smartphone,
  Store,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Utensils,
  Coffee,
  Car,
  ShoppingBag,
  Receipt,
  Home,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  MoreHorizontal,
  Wallet,
  Store,
  Gift,
  TrendingUp,
  PlusCircle,
  Smartphone,
  Briefcase,
  PiggyBank,
};

interface CategoryIconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 18,
  strokeWidth = 2,
}) => {
  const Icon = ICON_MAP[name] ?? Wallet;
  return <Icon size={size} strokeWidth={strokeWidth} />;
};
