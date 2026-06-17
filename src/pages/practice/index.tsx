import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePractice } from '@/store/PracticeContext'
import { validateBorrowForm, validateReturnForm, calculateScore } from '@/utils/scorer'
import BorrowSection from '@/components/BorrowSection'
import ReturnSection from '@/components/ReturnSection'
import ResultView from '@/components/ResultView'
import ConfirmDialog from '@/components/ConfirmDialog'
import styles from './index.module.scss'
import classnames from 'classnames'

const PracticePage: React.FC = () => {
  const {
    state,
    dispatch,
    updateBorrow,
    updateReturn,
    resetPractice,
    confirmBorrowWithErrors,
    goBackToBorrow,
    confirmReturnWithErrors,
    goBackToReturn
  } = usePractice()
  const {
    stage,
    currentTask,
    borrowForm,
    returnForm,
    borrowErrors,
    returnErrors,
    historicalBorrowErrors,
    currentResult
  } = state

  const handleGoToTasks = () => Taro.switchTab({ url: '/pages/tasks/index' })
  const handleGoToRecords = () => Taro.switchTab({ url: '/pages/records/index' })

  const handleBorrowChange = (form: Partial<typeof borrowForm>) => updateBorrow(form)
  const handleReturnChange = (form: Partial<typeof returnForm>) => updateReturn(form)

  const handleSubmitBorrow = () => {
    if (!currentTask) return
    console.log('[Practice] 借出校验:', borrowForm)
    const errors = validateBorrowForm(borrowForm, currentTask)
    dispatch({ type: 'VALIDATE_BORROW', payload: errors })
    if (errors.length > 0) {
      Taro.vibrateShort({ type: 'light' })
    }
  }

  const handleConfirmBorrowKeep = () => {
    confirmBorrowWithErrors()
  }

  const handleBackToBorrow = () => {
    goBackToBorrow()
  }

  const handleSubmitReturn = () => {
    if (!currentTask) return
    console.log('[Practice] 归还校验:', returnForm)
    const errors = validateReturnForm(returnForm, currentTask)
    dispatch({ type: 'VALIDATE_RETURN', payload: errors })
    if (errors.length > 0) {
      Taro.vibrateShort({ type: 'light' })
    } else {
      handleCompletePractice(errors)
    }
  }

  const handleCompletePractice = (finalReturnErrors = returnErrors) => {
    if (!currentTask) return
    Taro.showLoading({ title: '正在评分...' })
    setTimeout(() => {
      const finalBorrowErrors =
        borrowErrors.length > 0
          ? borrowErrors
          : validateBorrowForm(borrowForm, currentTask)
      const historicalErrors = {
        borrow: historicalBorrowErrors,
        returned: []
      }
      const result = calculateScore(
        currentTask,
        borrowForm,
        returnForm,
        finalBorrowErrors,
        finalReturnErrors,
        historicalBorrowErrors.length > 0 || finalReturnErrors.length > 0
          ? historicalErrors
          : undefined
      )
      result.duration = Math.floor((Date.now() - state.startTime) / 1000)
      console.log(
        '[Practice] 成绩单:',
        result.totalScore,
        '/',
        result.maxScore,
        '错误数:',
        result.scoreItems.filter(s => !s.passed).length,
        '历史错误:',
        historicalBorrowErrors.length
      )
      dispatch({ type: 'COMPLETE_PRACTICE', payload: result })
      Taro.hideLoading()
      Taro.vibrateShort({ type: 'medium' })
    }, 600)
  }

  const handleConfirmReturnKeep = () => {
    confirmReturnWithErrors()
    setTimeout(() => {
      handleCompletePractice(returnErrors)
    }, 100)
  }

  const handleBackToReturn = () => {
    goBackToReturn()
  }

  const handleRetry = () => {
    console.log('[Practice] 重置练习')
    resetPractice()
  }

  const renderIdle = () => (
    <View className={styles.idleWrap}>
      <View className={styles.idleIconWrap}>
        <Text className={styles.idleIcon}>📦</Text>
      </View>
      <Text className={styles.idleTitle}>选择任务开始练习</Text>
      <Text className={styles.idleDesc}>
        在任务列表中挑选训练任务卡，系统将引导你完成「借出 → 归还 → 评分」的完整周转件流程模拟。
      </Text>
      <View className={styles.tipList}>
        <Text className={styles.tipTitle}>练习流程要点：</Text>
        <View className={styles.tipItem}>
          <View className={styles.tipNum}>1</View>
          <Text className={styles.tipText}>录入件号 + 序号，一物一号锁定实物</Text>
        </View>
        <View className={styles.tipItem}>
          <View className={styles.tipNum}>2</View>
          <Text className={styles.tipText}>审查适航标签、拆装记录、工卡号</Text>
        </View>
        <View className={styles.tipItem}>
          <View className={styles.tipNum}>3</View>
          <Text className={styles.tipText}>判定拆下件状态，挂待修牌、核对附件</Text>
        </View>
        <View className={styles.tipItem}>
          <View className={styles.tipNum}>4</View>
          <Text className={styles.tipText}>成绩单会记录你犯过的错并给出正确做法</Text>
        </View>
      </View>
      <View className={styles.gotoBtn} onClick={handleGoToTasks}>
        <Text className={styles.gotoBtnText}>前往任务列表</Text>
      </View>
    </View>
  )

  const renderStageTabs = () => (
    <View className={styles.stageTabs}>
      <View
        className={classnames(
          styles.stageTab,
          (stage === 'borrow' || stage === 'confirm_borrow') && styles.stageTabActive,
          (stage === 'return' || stage === 'confirm_return' || stage === 'scoring') && styles.stageTabDone
        )}
      >
        <Text className={styles.stageTabNo}>
          {stage === 'return' || stage === 'confirm_return' || stage === 'scoring' ? '✓' : '1'}
        </Text>
        <Text className={styles.stageTabText}>借出</Text>
      </View>
      <View
        className={classnames(
          styles.stageTab,
          (stage === 'return' || stage === 'confirm_return') && styles.stageTabActive,
          stage === 'scoring' && styles.stageTabDone
        )}
      >
        <Text className={styles.stageTabNo}>
          {stage === 'scoring' ? '✓' : '2'}
        </Text>
        <Text className={styles.stageTabText}>归还</Text>
      </View>
      <View
        className={classnames(
          styles.stageTab,
          stage === 'scoring' && styles.stageTabActive
        )}
      >
        <Text className={styles.stageTabNo}>3</Text>
        <Text className={styles.stageTabText}>评分</Text>
      </View>
    </View>
  )

  if (stage === 'idle' || !currentTask) {
    return <View className={styles.page}>{renderIdle()}</View>
  }

  if (stage === 'scoring' && currentResult) {
    return (
      <View className={styles.page}>
        <ResultView
          result={currentResult}
          task={currentTask}
          onGoRecords={handleGoToRecords}
          onGoTasks={handleGoToTasks}
          onRetry={handleRetry}
        />
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.stageWrap}>
        {renderStageTabs()}
        {stage === 'borrow' && (
          <BorrowSection
            task={currentTask}
            form={borrowForm}
            errors={borrowErrors}
            onChange={handleBorrowChange}
            onSubmit={handleSubmitBorrow}
          />
        )}
        {stage === 'confirm_borrow' && (
          <View className={styles.confirmWrap}>
            <ConfirmDialog
              type="borrow"
              title="借出环节发现问题"
              description="以下错误会影响考核评分，你可以返回修改，或继续带着错误完成流程"
              errors={borrowErrors}
              confirmText="带着错误继续 →"
              backText="返回修改"
              onConfirm={handleConfirmBorrowKeep}
              onBack={handleBackToBorrow}
            />
          </View>
        )}
        {stage === 'return' && (
          <ReturnSection
            task={currentTask}
            form={returnForm}
            errors={returnErrors}
            onChange={handleReturnChange}
            onSubmit={handleSubmitReturn}
            onBack={() => dispatch({ type: 'START_BORROW' })}
          />
        )}
        {stage === 'confirm_return' && (
          <View className={styles.confirmWrap}>
            <ConfirmDialog
              type="return"
              title="归还环节发现问题"
              description="以下错误会影响考核评分，你可以返回修改，或提交评分并保留错误记录"
              errors={returnErrors}
              confirmText="带着错误提交评分"
              backText="返回修改"
              onConfirm={handleConfirmReturnKeep}
              onBack={handleBackToReturn}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export default PracticePage
