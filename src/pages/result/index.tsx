import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { usePractice } from '@/store/PracticeContext'
import { PracticeResult, ScoreItem as ScoreItemType } from '@/types'
import ScoreItemComponent from '@/components/ScoreItem'
import styles from './index.module.scss'
import classnames from 'classnames'

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m > 0 ? m + '分' : ''}${s}秒`
}

const ResultPage: React.FC = () => {
  const router = useRouter()
  const { state, resetPractice } = usePractice()
  const recordId = router.params.recordId

  const record: PracticeResult | undefined = useMemo(() => {
    const found = state.records.find(r => r.id === recordId)
    return found || state.currentResult || state.records[0]
  }, [recordId, state.records, state.currentResult])

  const borrowItems = useMemo<ScoreItemType[]>(
    () => (record ? record.scoreItems.filter(s => s.category === '借出环节') : []),
    [record]
  )

  const returnItems = useMemo<ScoreItemType[]>(
    () => (record ? record.scoreItems.filter(s => s.category === '归还环节') : []),
    [record]
  )

  const handleRetry = () => {
    console.log('[Result] 重新练习')
    resetPractice()
    Taro.switchTab({ url: '/pages/tasks/index' })
  }

  const handleBackToRecords = () => {
    console.log('[Result] 返回成绩列表')
    Taro.switchTab({ url: '/pages/records/index' })
  }

  if (!record) {
    return (
      <View className={styles.page}>
        <View className={styles.notFound}>
          <Text className={styles.notFoundText}>未找到对应的练习记录</Text>
          <View className={styles.notFoundBtn} onClick={handleBackToRecords}>
            <Text className={styles.notFoundBtnText}>返回列表</Text>
          </View>
        </View>
      </View>
    )
  }

  const borrowPassed = borrowItems.filter(s => s.passed).length
  const returnPassed = returnItems.filter(s => s.passed).length
  const borrowTotal = borrowItems.length
  const returnTotal = returnItems.length
  const borrowAllPassed = borrowPassed === borrowTotal
  const returnAllPassed = returnPassed === returnTotal

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.resultHeader}>
        <View className={styles.headerInner}>
          <View className={styles.resultBadge}>
            <Text className={styles.resultBadgeText}>
              {record.passed ? '✓ 考核通过' : '✕ 需要加强'}
            </Text>
          </View>
          <Text className={styles.resultTitle}>{record.taskTitle}</Text>
          <Text className={styles.resultSubtitle}>
            {record.aircraftNo} · 完成于 {record.completedAt}
          </Text>

          <View className={styles.scoreBoard}>
            <View className={styles.scoreMain}>
              <Text className={styles.scoreNumber}>{record.passRate}</Text>
              <Text className={styles.scoreUnit}>得分率</Text>
            </View>
            <View className={styles.scoreMeta}>
              <View className={styles.scoreRow}>
                <Text className={styles.scoreRowLabel}>实际得分</Text>
                <Text className={styles.scoreRowValue}>
                  {record.totalScore} / {record.maxScore}
                </Text>
              </View>
              <View className={styles.scoreRow}>
                <Text className={styles.scoreRowLabel}>正确项</Text>
                <Text className={classnames(styles.scoreRowValue, styles.valueGood)}>
                  {borrowPassed + returnPassed} 项
                </Text>
              </View>
              <View className={styles.scoreRow}>
                <Text className={styles.scoreRowLabel}>错误项</Text>
                <Text className={classnames(styles.scoreRowValue, styles.valueBad)}>
                  {(borrowTotal + returnTotal) - (borrowPassed + returnPassed)} 项
                </Text>
              </View>
              <View className={styles.scoreRow}>
                <Text className={styles.scoreRowLabel}>用时</Text>
                <Text className={styles.scoreRowValue}>{formatDuration(record.duration)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.infoCard}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>周转件名称</Text>
              <Text className={styles.infoValue}>{record.taskTitle}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>录入件号</Text>
              <Text className={styles.infoValue}>{record.borrowForm.partNo || '（未填）'}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>录入序号</Text>
              <Text className={styles.infoValue}>{record.borrowForm.serialNo || '（未填）'}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>工卡号</Text>
              <Text className={styles.infoValue}>{record.borrowForm.workCardNo || '（未填）'}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={classnames(styles.titleIcon, styles.titleIconBorrow)}>📥</View>
              <Text className={styles.sectionTitleText}>借出环节评分</Text>
            </View>
            <View
              className={classnames(
                styles.sectionSummary,
                borrowAllPassed ? styles.summaryOk : styles.summaryBad
              )}
            >
              {borrowPassed}/{borrowTotal} 正确
            </View>
          </View>
          {borrowItems.map(item => (
            <ScoreItemComponent key={item.id} item={item} />
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={classnames(styles.titleIcon, styles.titleIconReturn)}>📤</View>
              <Text className={styles.sectionTitleText}>归还环节评分</Text>
            </View>
            <View
              className={classnames(
                styles.sectionSummary,
                returnAllPassed ? styles.summaryOk : styles.summaryBad
              )}
            >
              {returnPassed}/{returnTotal} 正确
            </View>
          </View>
          {returnItems.map(item => (
            <ScoreItemComponent key={item.id} item={item} />
          ))}
        </View>

        {!record.passed && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitle}>
                <View className={classnames(styles.titleIcon, styles.titleIconSummary)}>💡</View>
                <Text className={styles.sectionTitleText}>学习建议</Text>
              </View>
            </View>
            <View className={styles.infoCard}>
              {record.scoreItems.filter(s => !s.passed).map(s => (
                <View key={s.id} className={styles.infoRow}>
                  <Text className={styles.infoLabel}>{s.field}</Text>
                  <Text className={classnames(styles.infoValue, styles.valueBad)}>
                    {s.feedback}
                  </Text>
                </View>
              ))}
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>正确做法</Text>
                <View style={{ flex: 1 }}>
                  {[...record.borrowErrors, ...record.returnErrors].map((e, idx) => (
                    <Text
                      key={idx}
                      className={classnames(styles.infoValue, styles.valueGood)}
                      style={{ display: 'block', marginBottom: '8rpx' }}
                    >
                      • {e.correctAction}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className={styles.actionBar}>
        <View className={styles.actionBtnSecondary} onClick={handleBackToRecords}>
          <Text className={styles.actionBtnSecondaryText}>查看历史</Text>
        </View>
        <View className={styles.actionBtnPrimary} onClick={handleRetry}>
          <Text className={styles.actionBtnPrimaryText}>再练一次</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default ResultPage
