import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePractice } from '@/store/PracticeContext'
import { PracticeResult, Task } from '@/types'
import ResultView from '@/components/ResultView'
import styles from './index.module.scss'
import classnames from 'classnames'

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m > 0 ? m + '分' : ''}${s}秒`
}

const RecordsPage: React.FC = () => {
  const { state } = usePractice()
  const { records, tasks } = state
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const summary = useMemo(() => {
    const total = records.length
    if (total === 0) {
      return { total, passed: 0, avgScore: 0, avgDuration: 0 }
    }
    const passed = records.filter(r => r.passed).length
    const avgScore = Math.round(records.reduce((s, r) => s + r.passRate, 0) / total)
    const avgDuration = Math.round(records.reduce((s, r) => s + r.duration, 0) / total)
    return { total, passed, avgScore, avgDuration }
  }, [records])

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleGoToPractice = () => {
    Taro.switchTab({ url: '/pages/tasks/index' })
  }

  const getTaskForRecord = (record: PracticeResult): Task | undefined => {
    return tasks.find(t => t.id === record.taskId)
  }

  const renderEmpty = () => (
    <View className={styles.emptyState}>
      <View className={styles.emptyIcon}>
        <Text className={styles.emptyIconText}>🏆</Text>
      </View>
      <Text className={styles.emptyTitle}>暂无练习记录</Text>
      <Text className={styles.emptyDesc}>前往任务列表选择任务卡开始练习吧</Text>
      <View className={styles.practiceBtn} onClick={handleGoToPractice}>
        <Text className={styles.practiceBtnText}>开始练习</Text>
      </View>
    </View>
  )

  const renderExpanded = (record: PracticeResult) => {
    const task = getTaskForRecord(record)
    return (
      <View className={styles.expandedBox}>
        <ResultView
          result={record}
          task={task}
          showActionBar={false}
          compact
        />
        <View className={styles.collapseBtn} onClick={() => toggleExpand(record.id)}>
          <Text className={styles.collapseBtnText}>收起详情 ▲</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>成绩回放</Text>
        <Text className={styles.pageSub}>回顾练习记录，针对薄弱点强化训练（本地持久化保存）</Text>

        <View className={styles.summaryCard}>
          <View className={styles.scoreCircle}>
            <Text className={styles.scoreValue}>{summary.avgScore || '--'}</Text>
            <Text className={styles.scoreUnit}>平均分</Text>
          </View>
          <View className={styles.summaryInfo}>
            <Text className={styles.summaryLabel}>训练数据概览</Text>
            <View className={styles.summaryGrid}>
              <View className={styles.summaryCell}>
                <Text className={classnames(styles.cellValue, summary.passed > 0 && styles.cellValueGood)}>
                  {summary.total}
                </Text>
                <Text className={styles.cellLabel}>总练习次数</Text>
              </View>
              <View className={styles.summaryCell}>
                <Text className={classnames(styles.cellValue, styles.cellValueGood)}>
                  {summary.passed}
                </Text>
                <Text className={styles.cellLabel}>通过次数</Text>
              </View>
              <View className={styles.summaryCell}>
                <Text className={styles.cellValue}>
                  {summary.total > 0 ? `${Math.round((summary.passed / summary.total) * 100)}%` : '--'}
                </Text>
                <Text className={styles.cellLabel}>通过率</Text>
              </View>
              <View className={styles.summaryCell}>
                <Text className={styles.cellValue}>
                  {summary.avgDuration > 0 ? formatDuration(summary.avgDuration) : '--'}
                </Text>
                <Text className={styles.cellLabel}>平均耗时</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>历史练习记录</Text>
        <Text className={styles.sectionCount}>共 {records.length} 条</Text>
      </View>

      <View className={styles.recordList}>
        {records.length === 0 ? (
          renderEmpty()
        ) : (
          records.map(record => (
            <View key={record.id} className={styles.recordGroup}>
              <View
                className={styles.recordCard}
                onClick={() => toggleExpand(record.id)}
              >
                <View className={styles.recordTop}>
                  <View className={styles.recordTitle}>
                    <Text className={styles.recordTask}>{record.taskTitle}</Text>
                    <View className={styles.recordMeta}>
                      <Text className={styles.recordAircraft}>{record.aircraftNo}</Text>
                      <Text className={styles.recordTime}>{record.completedAt}</Text>
                      <Text className={styles.recordTime}>· 用时{formatDuration(record.duration)}</Text>
                    </View>
                  </View>
                  <View
                    className={classnames(
                      styles.recordScoreBadge,
                      record.passed ? styles.badgePass : styles.badgeFail
                    )}
                  >
                    <Text className={styles.badgeScore}>{record.passRate}</Text>
                    <Text className={styles.badgeLabel}>{record.passed ? '通过' : '未通过'}</Text>
                  </View>
                </View>

                <View className={styles.recordStats}>
                  <View className={styles.recordStat}>
                    <Text className={classnames(styles.statNum, styles.statNumOk)}>
                      {record.scoreItems.filter(s => s.passed).length}
                    </Text>
                    <Text className={styles.statLabel}>正确项</Text>
                  </View>
                  <View className={styles.recordStat}>
                    <Text className={classnames(styles.statNum, styles.statNumBad)}>
                      {record.scoreItems.filter(s => !s.passed).length}
                    </Text>
                    <Text className={styles.statLabel}>错误项</Text>
                  </View>
                  <View className={styles.recordStat}>
                    <Text className={styles.statNum}>{record.totalScore}</Text>
                    <Text className={styles.statLabel}>得分/满分{record.maxScore}</Text>
                  </View>
                </View>

                <View className={styles.recordAction}>
                  <View className={styles.actionBtn}>
                    <Text className={styles.actionBtnText}>
                      {expandedId === record.id ? '收起详情 ▲' : '查看错误分析 ▼'}
                    </Text>
                  </View>
                </View>
              </View>

              {expandedId === record.id && renderExpanded(record)}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

export default RecordsPage
