import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { PracticeState, PracticeAction, Task, BorrowForm, ReturnForm } from '@/types'
import { mockRecords } from '@/data/mockData'

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

const initialState: PracticeState = {
  currentTask: null,
  stage: 'idle',
  borrowForm: { ...initialBorrowForm },
  returnForm: { ...initialReturnForm },
  borrowErrors: [],
  returnErrors: [],
  currentResult: null,
  startTime: 0,
  records: [...mockRecords]
}

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'SELECT_TASK':
      return {
        ...state,
        currentTask: action.payload,
        stage: 'borrow',
        borrowForm: { ...initialBorrowForm },
        returnForm: { ...initialReturnForm },
        borrowErrors: [],
        returnErrors: [],
        currentResult: null,
        startTime: Date.now()
      }

    case 'START_BORROW':
      return {
        ...state,
        stage: 'borrow',
        borrowForm: { ...initialBorrowForm },
        borrowErrors: []
      }

    case 'UPDATE_BORROW':
      return {
        ...state,
        borrowForm: { ...state.borrowForm, ...action.payload }
      }

    case 'VALIDATE_BORROW':
      return {
        ...state,
        borrowErrors: action.payload
      }

    case 'CONFIRM_BORROW':
      return {
        ...state,
        stage: 'return',
        returnForm: { ...initialReturnForm },
        returnErrors: []
      }

    case 'UPDATE_RETURN':
      return {
        ...state,
        returnForm: { ...state.returnForm, ...action.payload }
      }

    case 'VALIDATE_RETURN':
      return {
        ...state,
        returnErrors: action.payload
      }

    case 'COMPLETE_PRACTICE': {
      const newRecords = [action.payload, ...state.records]
      return {
        ...state,
        stage: 'completed',
        currentResult: action.payload,
        records: newRecords
      }
    }

    case 'RESET_PRACTICE':
      return {
        ...state,
        currentTask: null,
        stage: 'idle',
        borrowForm: { ...initialBorrowForm },
        returnForm: { ...initialReturnForm },
        borrowErrors: [],
        returnErrors: [],
        currentResult: null,
        startTime: 0
      }

    case 'LOAD_RECORDS':
      return {
        ...state,
        records: action.payload
      }

    default:
      return state
  }
}

interface PracticeContextValue {
  state: PracticeState
  dispatch: React.Dispatch<PracticeAction>
  selectTask: (task: Task) => void
  updateBorrow: (form: Partial<BorrowForm>) => void
  updateReturn: (form: Partial<ReturnForm>) => void
  resetPractice: () => void
}

const PracticeContext = createContext<PracticeContextValue | undefined>(undefined)

export const PracticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(practiceReducer, initialState)

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

  return (
    <PracticeContext.Provider
      value={{ state, dispatch, selectTask, updateBorrow, updateReturn, resetPractice }}
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
