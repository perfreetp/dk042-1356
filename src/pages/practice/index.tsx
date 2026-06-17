import React, { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePractice } from '@/store/PracticeContext'
import { validateBorrowForm, validateReturnForm, calculateScore } from '@/utils/scorer'
import BorrowSection from '@/components/BorrowSection'
import ReturnSection from '@/components/ReturnSection'
import styles from './index.module.scss'
import classnames from 'classnames'

const PracticePage: React.FC = () => {
  const { state, dispatch, updateBorrow, updateReturn, resetPractice } = usePractice()
  const { stage, currentTask, borrowForm, returnForm, borrowErrors, returnErrors } = state

  useEffect(() => {
    if (stage === 'completed' && state.currentResult) {
      console.log('[Practice] 完成练习，跳转评分页:', state.currentResult.id)
      Taro.navigateTo({
        url: `/pages/result/index?recordId=${state.currentResult.id}`
      })
    }
  }, [stage, state.currentResult])

  const handleGoToTasks = () => {
    Taro.switchTab({ url: '/pages/tasks/index' })
  }

  const handleBorrowChange = (form: Partial<typeof borrowForm>) => {
    updateBorrow(form)
  }

  const handleReturnChange = (form: Partial<typeof returnForm>) => {
    updateReturn(form)
  }

  const handleSubmitBorrow = () => {
    if (!currentTask) return
    console.log('[Practice] 提交借出校验:', borrowForm)
    const errors = validateBorrowForm(borrowForm, currentTask)
    dispatch({ type: 'VALIDATE_BORROW', payload: errors })

    if (errors.length > 0) {
      Taro.vibrateShort({ type: 'medium' })
      Taro.showToast({
        title: `发现 ${errors.length} 个问题`,
        icon: 'none',
        duration: 2000
      })
      return
    }

    Taro.showToast({
      title: '借出信息校验通过',
      icon: 'success',
      duration: 1000
    })
    setTimeout(() => {
      dispatch({ type: 'CONFIRM_BORROW' })
    }, 600)
  }

  const handleBackToBorrow = () => {
    dispatch({ type: 'START_BORROW' })
  }

  const handleSubmitReturn = () => {
    if (!currentTask) return
    console.log('[Practice] 提交归还校验:', returnForm)
    const errors = validateReturnForm(returnForm, currentTask)
    dispatch({ type: 'VALIDATE_RETURN', payload: errors })

    if (errors.length > 0) {
      Taro.vibrateShort({ type: 'medium' })
      Taro.showToast({
        title: `发现 ${errors.length} 个问题`,
        icon: 'none',
        duration: 2000
      })
      return
    }

    Taro.showLoading({ title: '正在评分...' })
    setTimeout(() => {
      const result = calculateScore(
        currentTask,
        borrowForm,
        returnForm,
        borrowErrors,
        errors
      )
      result.duration = Math.floor((Date.now() - state.startTime) / 1000)
      console.log('[Practice] 评分结果:', result.totalScore, '/', result.maxScore)
      dispatch({ type: 'COMPLETE_PRACTICE', payload: result })
      Taro.hideLoading()
    }, 800)
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
          <Text className={styles.tipText}>查看评分结果，针对错误点反复强化</Text>
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
          stage === 'borrow' && styles.stageTabActive,
          (stage === 'return' || stage === 'completed') && styles.stageTabDone
        )}
      >
        <Text className={styles.stageTabNo}>
          {(stage === 'return' || stage === 'completed') ? '✓' : '1'}
        </Text>
        <Text className={styles.stageTabText}>借出</Text>
      </View>
      <View
        className={classnames(
          styles.stageTab,
          stage === 'return' && styles.stageTabActive,
          stage === 'completed' && styles.stageTabDone
        )}
      >
        <Text className={styles.stageTabNo}>
          {stage === 'completed' ? '✓' : '2'}
        </Text>
        <Text className={styles.stageTabText}>归还</Text>
      </View>
      <View
        className={classnames(
          styles.stageTab,
          stage === 'completed' && styles.stageTabActive
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
        {stage === 'return' && (
          <ReturnSection
            task={currentTask}
            form={returnForm}
            errors={returnErrors}
            onChange={handleReturnChange}
            onSubmit={handleSubmitReturn}
            onBack={handleBackToBorrow}
          />
        )}
      </View>
    </View>
  )
}

export default PracticePage
