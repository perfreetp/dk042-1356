export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

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
}

export type PracticeStage = 'idle' | 'borrow' | 'return' | 'scoring' | 'completed'

export interface PracticeState {
  currentTask: Task | null
  stage: PracticeStage
  borrowForm: BorrowForm
  returnForm: ReturnForm
  borrowErrors: FieldError[]
  returnErrors: FieldError[]
  currentResult: PracticeResult | null
  startTime: number
  records: PracticeResult[]
}

export type PracticeAction =
  | { type: 'SELECT_TASK'; payload: Task }
  | { type: 'START_BORROW' }
  | { type: 'UPDATE_BORROW'; payload: Partial<BorrowForm> }
  | { type: 'VALIDATE_BORROW'; payload: FieldError[] }
  | { type: 'CONFIRM_BORROW' }
  | { type: 'UPDATE_RETURN'; payload: Partial<ReturnForm> }
  | { type: 'VALIDATE_RETURN'; payload: FieldError[] }
  | { type: 'COMPLETE_PRACTICE'; payload: PracticeResult }
  | { type: 'RESET_PRACTICE' }
  | { type: 'LOAD_RECORDS'; payload: PracticeResult[] }
