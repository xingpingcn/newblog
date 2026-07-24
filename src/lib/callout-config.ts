import { cva } from 'class-variance-authority'

export const CALLOUT_CONFIG = {
  note: {
    style: 'border-blue-500 dark:bg-blue-950/5',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: 'info',
  },
  tip: {
    style: 'border-green-500 dark:bg-green-950/5',
    textColor: 'text-green-700 dark:text-green-300',
    icon: 'lightbulb',
  },
  warning: {
    style: 'border-amber-500 dark:bg-amber-950/5',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: 'triangle-alert',
  },
  danger: {
    style: 'border-red-500 dark:bg-red-950/5',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'shield-alert',
  },
  caution: {
    style: 'border-red-500 dark:bg-red-950/5',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'shield-alert',
  },
  important: {
    style: 'border-purple-500 dark:bg-purple-950/5',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: 'message-square-warning',
  },
  definition: {
    style: 'border-purple-500 dark:bg-purple-950/5',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: 'book-open',
  },
  theorem: {
    style: 'border-teal-500 dark:bg-teal-950/5',
    textColor: 'text-teal-700 dark:text-teal-300',
    icon: 'circle-check-big',
  },
  lemma: {
    style: 'border-sky-400 dark:bg-sky-950/5',
    textColor: 'text-sky-700 dark:text-sky-300',
    icon: 'puzzle',
  },
  proof: {
    style: 'border-gray-500 dark:bg-gray-950/5',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'square-check-big',
  },
  corollary: {
    style: 'border-cyan-500 dark:bg-cyan-950/5',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    icon: 'git-branch',
  },
  proposition: {
    style: 'border-slate-500 dark:bg-slate-950/5',
    textColor: 'text-slate-700 dark:text-slate-300',
    icon: 'file-text',
  },
  axiom: {
    style: 'border-violet-600 dark:bg-violet-950/5',
    textColor: 'text-violet-700 dark:text-violet-300',
    icon: 'anchor',
  },
  conjecture: {
    style: 'border-pink-500 dark:bg-pink-950/5',
    textColor: 'text-pink-700 dark:text-pink-300',
    icon: 'circle-question-mark',
  },
  notation: {
    style: 'border-slate-400 dark:bg-slate-950/5',
    textColor: 'text-slate-700 dark:text-slate-300',
    icon: 'pen-tool',
  },
  remark: {
    style: 'border-gray-400 dark:bg-gray-950/5',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'message-circle',
  },
  intuition: {
    style: 'border-yellow-500 dark:bg-yellow-950/5',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: 'lightbulb',
  },
  recall: {
    style: 'border-blue-300 dark:bg-blue-950/5',
    textColor: 'text-blue-600 dark:text-blue-300',
    icon: 'rotate-ccw',
  },
  explanation: {
    style: 'border-lime-500 dark:bg-lime-950/5',
    textColor: 'text-lime-700 dark:text-lime-300',
    icon: 'circle-question-mark',
  },
  example: {
    style: 'border-emerald-500 dark:bg-emerald-950/5',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: 'code',
  },
  exercise: {
    style: 'border-indigo-500 dark:bg-indigo-950/5',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: 'dumbbell',
  },
  problem: {
    style: 'border-orange-600 dark:bg-orange-950/5',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: 'circle-alert',
  },
  answer: {
    style: 'border-teal-500 dark:bg-teal-950/5',
    textColor: 'text-teal-700 dark:text-teal-300',
    icon: 'check',
  },
  solution: {
    style: 'border-emerald-600 dark:bg-emerald-950/5',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: 'circle-check',
  },
  summary: {
    style: 'border-sky-500 dark:bg-sky-950/5',
    textColor: 'text-sky-700 dark:text-sky-300',
    icon: 'list',
  },
} as const

export type CalloutVariant = keyof typeof CALLOUT_CONFIG

export const CALLOUT_VARIANTS = Object.keys(
  CALLOUT_CONFIG,
) as CalloutVariant[]

export const isCalloutVariant = (value: string): value is CalloutVariant =>
  Object.hasOwn(CALLOUT_CONFIG, value)

export const calloutVariants = cva(
  'relative px-4 py-3 my-6 border-l-4 text-sm',
  {
    variants: {
      variant: Object.fromEntries(
        Object.entries(CALLOUT_CONFIG).map(([key, value]) => [key, value.style]),
      ),
    },
    defaultVariants: { variant: 'note' },
  },
)
