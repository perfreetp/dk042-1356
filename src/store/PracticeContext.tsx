import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { PracticeState, PracticeAction, Task, BorrowForm, ReturnForm, FieldError } from '@/types'
import { mockTasks, mockRecords } from '@/data/mockData'
import { migrateAllRecords } from '@/utils/scorer'

const STORAGE_KEYS = {
  RECORDS: 'amt_records_v1',
  TASKS: 'amt_tasks_v1'
}

const initialBorrowForm: BorrowForm = {
  partNo: '',
  serialNo: '',
  hasAirworthinessTag: false,
  hasDisassemblyRecord: false,
  workCardNo: ''
}

const initialReturnForm: ReturnForm = {
  partStatus: 'serviceable',
  hasRepairTag: false,
  accessoriesComplete: false,
  returnRemarks: ''
}

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = Taro.getStorageSync(key)
    if (raw && typeof raw === 'string') {
      return JSON.parse(raw) as T
    }
  } catch (err) {
    console.error('[Storage] 读取失败:', key, err)
  }
  return fallback
}

const saveToStorage = <T>(key: string, value: T) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value))
  } catch (err) {
    console.error('[Storage] 写入失败:', key, err)
  }
}

const mergeHistoricalErrors = (existing: FieldError[], newErrors: FieldError[]): FieldError[] => {
  const merged = [...existing]
  newErrors.forEach(err => {
    const exists = merged.some(e => e.field === err.field && e.category === err.category)
    if (!exists) {
      merged.push(err)
    }
  })
  return merged
}

const persistedRecords = migrateAllRecords(loadFromStorage(STORAGE_KEYS.RECORDS, mockRecords))
const persistedTasks = loadFromStorage(STORAGE_KEYS.TASKS, mockTasks)

const initialState: PracticeState & { tasks: Task[]; historicalBorrowErrors: FieldError[]; historicalReturnErrors: FieldError[] } = {
  tasks: persistedTasks,
  currentTask: null,
  stage: 'idle',
  borrowForm: { ...initialBorrowForm },
  returnForm: { ...initialReturnForm },
  borrowErrors: [],
  returnErrors: [],
  historicalBorrowErrors: [],
  historicalReturnErrors: [],
  currentResult: null,
  startTime: 0,
  records: persistedRecords
}

type ExtendedState = PracticeState & { tasks: Task[]; historicalBorrowErrors: FieldError[]; historicalReturnErrors: FieldError[] }
type ExtendedAction =
  | PracticeAction
  | { type: 'UPDATE_TASKS'; payload: Task[] }
  | { type: 'SHOW_RESULT' }
  | { type: 'GO_BACK_BORROW_FROM_CONFIRM' }
  | { type: 'GO_BACK_RETURN_FROM_CONFIRM' }

function practiceReducer(
  state: ExtendedState,
  action: ExtendedAction
): ExtendedState {
  switch (action.type) {
    case 'UPDATE_TASKS':
      saveToStorage(STORAGE_KEYS.TASKS, action.payload)
      return { ...state, tasks: action.payload }

    case 'SELECT_TASK':
      return {
        ...state,
        currentTask: action.payload,
        stage: 'borrow',
        borrowForm: { ...initialBorrowForm },
        returnForm: { ...initialReturnForm },
        borrowErrors: [],
        returnErrors: [],
        historicalBorrowErrors: [],
        historicalReturnErrors: [],
        currentResult: null,
        startTime: Date.now()
      }

    case 'START_BORROW':
      return {
        ...state,
        stage: 'borrow',
        borrowErrors: []
      }

    case 'UPDATE_BORROW':
      return {
        ...state,
        borrowForm: { ...state.borrowForm, ...action.payload }
      }

    case 'VALIDATE_BORROW': {
      const hasErrors = action.payload.length > 0
      const newHistoricalBorrowErrors = hasErrors
        ? mergeHistoricalErrors(state.historicalBorrowErrors, action.payload)
        : state.historicalBorrowErrors
      return {
        ...state,
        borrowErrors: action.payload,
        historicalBorrowErrors: newHistoricalBorrowErrors,
        stage: hasErrors ? 'confirm_borrow' : 'return'
      }
    }

    case 'CONFIRM_BORROW': {
      return {
        ...state,
        stage: 'return',
        returnForm: { ...initialReturnForm },
        returnErrors: [],
        borrowErrors: state.borrowErrors
      }
    }

    case 'GO_BACK_BORROW_FROM_CONFIRM':
      return {
        ...state,
        stage: 'borrow'
      }

    case 'UPDATE_RETURN':
      return {
        ...state,
        returnForm: { ...state.returnForm, ...action.payload }
      }

    case 'VALIDATE_RETURN': {
      const hasErrors = action.payload.length > 0
      const newHistoricalReturnErrors = hasErrors
        ? mergeHistoricalErrors(state.historicalReturnErrors, action.payload)
        : state.historicalReturnErrors
      return {
        ...state,
        returnErrors: action.payload,
        historicalReturnErrors: newHistoricalReturnErrors,
        stage: hasErrors ? 'confirm_return' : 'scoring'
      }
    }

    case 'CONFIRM_RETURN': {
      return {
        ...state,
        stage: 'scoring'
      }
    }

    case 'GO_BACK_RETURN_FROM_CONFIRM':
      return {
        ...state,
        stage: 'return'
      }

    case 'COMPLETE_PRACTICE': {
      const newRecords = [action.payload, ...state.records]
      saveToStorage(STORAGE_KEYS.RECORDS, newRecords)

      const newTasks = state.tasks.map(t => {
        if (t.id === action.payload.taskId) {
          const taskRecords = newRecords.filter(r => r.taskId === t.id)
          const avgScore =
            taskRecords.length > 0
              ? Math.round(taskRecords.reduce((s, r) => s + r.passRate, 0) / taskRecords.length)
              : 0
          return {
            ...t,
            status: 'completed' as const,
            expectedScore: avgScore
          }
        }
        return t
      })
      saveToStorage(STORAGE_KEYS.TASKS, newTasks)

      const stageToUse = action.payload.borrowErrors.length > 0 || action.payload.returnErrors.length > 0
        ? 'scoring'
        : 'scoring'

      return {
        ...state,
        stage: stageToUse,
        currentResult: action.payload,
        records: newRecords,
        tasks: newTasks
      }
    }

    case 'SHOW_RESULT':
      return { ...state, stage: 'scoring' }

    case 'RESET_PRACTICE':
      return {
        ...state,
        currentTask: null,
        stage: 'idle',
        borrowForm: { ...initialBorrowForm },
        returnForm: { ...initialReturnForm },
        borrowErrors: [],
        returnErrors: [],
        historicalBorrowErrors: [],
        historicalReturnErrors: [],
        currentResult: null,
        startTime: 0
      }

    case 'LOAD_RECORDS':
      saveToStorage(STORAGE_KEYS.RECORDS, action.payload)
      return { ...state, records: action.payload }

    default:
      return state
  }
}

interface RecordsFilter {
  taskId: string | 'all'
  errorCategories: ErrorCategory[]
}

interface PracticeContextValue {
  state: ExtendedState
  dispatch: React.Dispatch<ExtendedAction>
  recordsFilter: RecordsFilter
  setRecordsFilter: (filter: RecordsFilter) => void
  selectTask: (task: Task) => void
  updateBorrow: (form: Partial<BorrowForm>) => void
  updateReturn: (form: Partial<ReturnForm>) => void
  resetPractice: () => void
  validateAndNextBorrow: () => void
  confirmBorrowWithErrors: () => void
  goBackToBorrow: () => void
  validateAndNextReturn: () => void
  confirmReturnWithErrors: () => void
  goBackToReturn: () => void
}

const PracticeContext = createContext<PracticeContextValue | undefined>(undefined)

export const PracticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(practiceReducer, initialState)
  const [recordsFilter, setRecordsFilter] = React.useState<RecordsFilter>({
    taskId: 'all',
    errorCategories: []
  })

  useEffect(() => {
    console.log('[PracticeProvider] 已加载持久化数据:', {
      tasks: state.tasks.length,
      records: state.records.length
    })
  }, [])

  const selectTask = (task: Task) => {
    dispatch({ type: 'SELECT_TASK', payload: task })
  }

  const updateBorrow = (form: Partial<BorrowForm>) => {
    dispatch({ type: 'UPDATE_BORROW', payload: form })
  }

  const updateReturn = (form: Partial<ReturnForm>) => {
    dispatch({ type: 'UPDATE_RETURN', payload: form })
  }

  const resetPractice = () => {
    dispatch({ type: 'RESET_PRACTICE' })
  }

  const validateAndNextBorrow = () => {
    dispatch({ type: 'START_BORROW' })
  }

  const confirmBorrowWithErrors = () => {
    dispatch({ type: 'CONFIRM_BORROW', payload: { keepErrors: true } })
  }

  const goBackToBorrow = () => {
    dispatch({ type: 'GO_BACK_BORROW_FROM_CONFIRM' })
  }

  const validateAndNextReturn = () => {
  }

  const confirmReturnWithErrors = () => {
    dispatch({ type: 'CONFIRM_RETURN', payload: { keepErrors: true } })
  }

  const goBackToReturn = () => {
    dispatch({ type: 'GO_BACK_RETURN_FROM_CONFIRM' })
  }

  return (
    <PracticeContext.Provider
      value={{
        state,
        dispatch,
        recordsFilter,
        setRecordsFilter,
        selectTask,
        updateBorrow,
        updateReturn,
        resetPractice,
        validateAndNextBorrow,
        confirmBorrowWithErrors,
        goBackToBorrow,
        validateAndNextReturn,
        confirmReturnWithErrors,
        goBackToReturn
      }}
    >
      {children}
    </PracticeContext.Provider>
  )
}

export const usePractice = (): PracticeContextValue => {
  const context = useContext(PracticeContext)
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider')
  }
  return context
}
