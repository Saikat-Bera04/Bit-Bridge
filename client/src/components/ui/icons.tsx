import { Loader2, AlertCircle, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronDown, ChevronUp, ChevronsRight, Command, CreditCard, File, FileText, HelpCircle, Image, Laptop, Moon, MoreVertical, Pizza, Plus, Settings, SunMedium, Trash, Twitter, User, X, type LucideIcon } from 'lucide-react';

export const Icons = {
  spinner: Loader2,
  logo: Command,
  close: X,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronsLeft: ChevronsLeft,
  chevronsRight: ChevronsRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  settings: Settings,
  user: User,
  plus: Plus,
  help: HelpCircle,
  pizza: Pizza,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  twitter: Twitter,
  creditCard: CreditCard,
  file: File,
  fileText: FileText,
  trash: Trash,
  image: Image,
  alert: AlertCircle,
  check: Check,
  moreVertical: MoreVertical,
} as const;

export type IconName = keyof typeof Icons;
