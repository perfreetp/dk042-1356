export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type ErrorCategory =
  | 'missing_serial_no'
  | 'missing_airworthiness_tag'
  | 'missing_disassembly_record'
  | 'missing_work_card_no'
  | 'missing_repair_tag'
  | 'wrong_part_status'
  | 'incomplete_accessories'
  | 'format_error'
  | 'other'

export const ERROR_CATEGORY_LABELS: Record<ErrorCategory, string> = {
  missing_serial_no: '漏填序号',
  missing_airworthiness_tag: '适航标签',
  missing_disassembly_record: '拆装记录',
  missing_work_card_no: '工卡号',
  missing_repair_tag: '待修牌',
  wrong_part_status: '状态判定错误',
  incomplete_accessories: '附件不齐套',
  format_error: '格式错误',
  other: '其他错误'
}

export interface Task {
  id: string
  title: string
  description: string
  aircraftNo: string
  system: string
  difficulty: TaskDifficulty
  status: TaskStatus
  expectedScore?: number
  createdAt: string
  partName: string
  partNo: string
  serialNo: string
  needAirworthinessTag: boolean
  needDisassemblyRecord: boolean
  needWorkCardNo: boolean
  correctReturnStatus: string
  needRepairTag: boolean
  needCompleteAccessories: boolean
}

export interface TaskStats {
  taskId: string
  practiceCount: number
  passCount: number
  recentScore: number | null
  highestScore: number | null
  recentCompletedAt: string | null
  errorCategoryCounts: Partial<Record<ErrorCategory, number>>
}

export interface BorrowForm {
  partNo: string
  serialNo: string
  hasAirworthinessTag: boolean
  hasDisassemblyRecord: boolean
  workCardNo: string
}

export type ReturnStatus = 'serviceable' | 'unserviceable' | 'awaiting_repair' | 'scrapped'

export interface ReturnForm {
  partStatus: ReturnStatus
  hasRepairTag: boolean
  accessoriesComplete: boolean
  returnRemarks: string
}

export type FieldErrorType = 'missing' | 'format' | 'wrong_choice'

export interface FieldError {
  field: string
  type: FieldErrorType
  category: ErrorCategory
  message: string
  correctAction: string
}

export interface ScoreItem {
  id: string
  category: string
  field: string
  description: string
  passed: boolean
  userAnswer: string
  correctAnswer: string
  feedback: string
  score: number
  maxScore: number
  errorCategory?: ErrorCategory
}

export interface PracticeResult {
  id: string
  taskId: string
  taskTitle: string
  aircraftNo: string
  totalScore: number
  maxScore: number
  passRate: number
  passed: boolean
  scoreItems: ScoreItem[]
  borrowErrors: FieldError[]
  returnErrors: FieldError[]
  borrowForm: BorrowForm
  returnForm: ReturnForm
  completedAt: string
  duration: number
  historicalErrors?: {
    borrow: FieldError[]
    returned: FieldError[]
  }
}

export type PracticeStage = 'idle' | 'borrow' | 'confirm_borrow' | 'return' | 'confirm_return' | 'scoring' | 'completed'

export interface PracticeState {
  currentTask: Task | null
  stage: PracticeStage
  borrowForm: BorrowForm
  returnForm: ReturnForm
  borrowErrors: FieldError[]
  returnErrors: FieldError[]
  historicalBorrowErrors: FieldError[]
  currentResult: PracticeResult | null
  startTime: number
  records: PracticeResult[]
}

export type PracticeAction =
  | { type: 'SELECT_TASK'; payload: Task }
  | { type: 'START_BORROW' }
  | { type: 'UPDATE_BORROW'; payload: Partial<BorrowForm> }
  | { type: 'VALIDATE_BORROW'; payload: FieldError[] }
  | { type: 'CONFIRM_BORROW'; payload: { keepErrors: boolean } }
  | { type: 'UPDATE_RETURN'; payload: Partial<ReturnForm> }
  | { type: 'VALIDATE_RETURN'; payload: FieldError[] }
  | { type: 'CONFIRM_RETURN'; payload: { keepErrors: boolean } }
  | { type: 'COMPLETE_PRACTICE'; payload: PracticeResult }
  | { type: 'RESET_PRACTICE' }
  | { type: 'LOAD_RECORDS'; payload: PracticeResult[] }

export interface ErrorFrequencyItem {
  category: ErrorCategory
  count: number
  label: string
  relatedTaskIds: string[]
}

export interface TaskRecommendation {
  taskId: string
  taskTitle: string
  reason: string
  practiceCount: number
  avgScore: number
}

export interface TrainingReport {
  totalPractice: number
  totalPassed: number
  avgScore: number
  periodDays: number
  topErrors: ErrorFrequencyItem[]
  weakCategories: ErrorCategory[]
  recommendedTasks: TaskRecommendation[]
  generatedAt: string
}
