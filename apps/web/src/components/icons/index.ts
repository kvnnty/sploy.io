/**
 * Unified icon exports — combine Lucide and Heroicons.
 * Prefer Lucide for UI chrome; Heroicons for nav, marketing, and feature cards.
 */
export { Icon, type IconProps } from './icon';
export { IconBadge } from './icon-badge';
export type { HeroIcon, IconComponent, IconSource } from './types';

// Lucide (UI actions, editor, status)
export {
  ArrowUp,
  BookOpen,
  Cable,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CreditCard,
  FlaskConical,
  Library,
  MenuIcon,
  NotebookTabs,
  PlusSquare,
  Settings2,
  Sparkles,
  User,
  Wand2,
  Workflow,
} from 'lucide-react';

// Heroicons outline (nav, features, marketing)
export {
  ArrowPathIcon,
  BoltIcon,
  ChartBarSquareIcon,
  CircleStackIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FolderOpenIcon,
  LightBulbIcon,
  LinkIcon,
  PresentationChartLineIcon,
  QueueListIcon,
  RectangleStackIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TableCellsIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

// Heroicons solid (accents, filled states)
export {
  CheckCircleIcon,
  SparklesIcon as SparklesSolidIcon,
} from '@heroicons/react/24/solid';
