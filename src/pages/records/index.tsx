import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePractice } from '@/store/PracticeContext'
import {
  PracticeResult,
  Task,
  ErrorCategory,
  ERROR_CATEGORY_LABELS
} from '@/types'
import { getResultErrorCategories } from '@/utils/scorer'
import ResultView from '@/components/ResultView'
import styles from './index.module.scss'
import classnames from 'classnames'

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m > 0 ? m + '分' : ''}${s}秒`
}

interface Filters {
  taskId: string | 'all'
  passed: 'all' | 'passed' | 'failed'
  errorCategories: ErrorCategory[]
}

const RecordsPage: React.FC = () => {
  const { state } = usePractice()
  const { records, tasks } = state
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    taskId: 'all',
    passed: 'all',
    errorCategories: []
  })
  const [showFilters, setShowFilters] = useState(false)

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

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (filters.taskId !== 'all' && record.taskId !== filters.taskId) {
        return false
      }
      if (filters.passed === 'passed' && !record.passed) {
        return false
      }
      if (filters.passed === 'failed' && record.passed) {
        return false
      }
      if (filters.errorCategories.length > 0) {
        const recordCategories = getResultErrorCategories(record)
        const hasMatch = filters.errorCategories.some(cat => recordCategories.includes(cat))
        if (!hasMatch) return false
      }
      return true
    })
  }, [records, filters])

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleGoToPractice = () => {
    Taro.switchTab({ url: '/pages/tasks/index' })
  }

  const handleGoToReport = () => {
    Taro.switchTab({ url: '/pages/tasks/index' })
    setTimeout(() => {
      Taro.showToast({ title: '可在任务列表查看训练报告', icon: 'none' })
    }, 100)
  }

  const getTaskForRecord = (record: PracticeResult): Task | undefined => {
    return tasks.find(t => t.id === record.taskId)
  }

  const toggleErrorCategory = (category: ErrorCategory) => {
    setFilters(prev => {
      const exists = prev.errorCategories.includes(category)
      return {
        ...prev,
        errorCategories: exists
          ? prev.errorCategories.filter(c => c !== category)
          : [...prev.errorCategories, category]
      }
    })
  }

  const clearFilters = () => {
    setFilters({ taskId: 'all', passed: 'all', errorCategories: [] })
  }

  const hasActiveFilters =
    filters.taskId !== 'all' ||
    filters.passed !== 'all' ||
    filters.errorCategories.length > 0

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
          highlightCategories={filters.errorCategories}
        />
        <View className={styles.collapseBtn} onClick={() => toggleExpand(record.id)}>
          <Text className={styles.collapseBtnText}>收起详情 ▲</Text>
        </View>
      </View>
    )
  }

  const errorCategoryOptions: { value: ErrorCategory; label: string }[] = [
    { value: 'missing_serial_no', label: '漏填序号' },
    { value: 'missing_airworthiness_tag', label: '适航标签' },
    { value: 'missing_disassembly_record', label: '拆装记录' },
    { value: 'missing_work_card_no', label: '工卡号' },
    { value: 'missing_repair_tag', label: '待修牌' },
    { value: 'wrong_part_status', label: '状态判定' },
    { value: 'incomplete_accessories', label: '附件不齐套' },
    { value: 'format_error', label: '格式错误' }
  ]

  const activeFilterCount =
    (filters.taskId !== 'all' ? 1 : 0) +
    (filters.passed !== 'all' ? 1 : 0) +
    filters.errorCategories.length

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <View>
            <Text className={styles.pageTitle}>成绩回放</Text>
            <Text className={styles.pageSub}>回顾练习记录，针对薄弱点强化训练（本地持久化保存）</Text>
          </View>
          <View
            className={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Text className={styles.filterToggleText}>
              {showFilters ? '收起筛选' : '筛选'}
              {activeFilterCount > 0 && (
                <Text className={styles.filterBadge}>{activeFilterCount}</Text>
              )}
            </Text>
          </View>
        </View>

        {showFilters && (
          <View className={styles.filterPanel}>
            <View className={styles.filterSection}>
              <Text className={styles.filterLabel}>按任务</Text>
              <ScrollView scrollX className={styles.chipScroll}>
                <View className={styles.chipList}>
                  <View
                    className={classnames(
                      styles.chip,
                      filters.taskId === 'all' && styles.chipActive
                    )}
                    onClick={() => setFilters(prev => ({ ...prev, taskId: 'all' }))}
                  >
                    <Text className={styles.chipText}>全部任务</Text>
                  </View>
                  {tasks.slice(0, 6).map(task => (
                    <View
                      key={task.id}
                      className={classnames(
                        styles.chip,
                        filters.taskId === task.id && styles.chipActive
                      )}
                      onClick={() => setFilters(prev => ({ ...prev, taskId: task.id }))}
                    >
                      <Text className={styles.chipText}>{task.aircraftNo}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className={styles.filterSection}>
              <Text className={styles.filterLabel}>通过状态</Text>
              <View className={styles.chipList}>
                <View
                  className={classnames(
                    styles.chip,
                    filters.passed === 'all' && styles.chipActive
                  )}
                  onClick={() => setFilters(prev => ({ ...prev, passed: 'all' }))}
                >
                  <Text className={styles.chipText}>全部</Text>
                </View>
                <View
                  className={classnames(
                    styles.chip,
                    filters.passed === 'passed' && styles.chipActive,
                    filters.passed === 'passed' && styles.chipSuccess
                  )}
                  onClick={() => setFilters(prev => ({ ...prev, passed: 'passed' }))}
                >
                  <Text className={styles.chipText}>已通过</Text>
                </View>
                <View
                  className={classnames(
                    styles.chip,
                    filters.passed === 'failed' && styles.chipActive,
                    filters.passed === 'failed' && styles.chipDanger
                  )}
                  onClick={() => setFilters(prev => ({ ...prev, passed: 'failed' }))}
                >
                  <Text className={styles.chipText}>未通过</Text>
                </View>
              </View>
            </View>

            <View className={styles.filterSection}>
              <Text className={styles.filterLabel}>错误类型（多选）</Text>
              <View className={styles.chipList}>
                {errorCategoryOptions.map(opt => (
                  <View
                    key={opt.value}
                    className={classnames(
                      styles.chip,
                      filters.errorCategories.includes(opt.value) && styles.chipActive,
                      filters.errorCategories.includes(opt.value) && styles.chipWarning
                    )}
                    onClick={() => toggleErrorCategory(opt.value)}
                  >
                    <Text className={styles.chipText}>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {hasActiveFilters && (
              <View className={styles.clearFiltersRow}>
                <View className={styles.clearBtn} onClick={clearFilters}>
                  <Text className={styles.clearBtnText}>清除全部筛选</Text>
                </View>
              </View>
            )}
          </View>
        )}

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
        <Text className={styles.sectionTitle}>
          历史练习记录
          {hasActiveFilters && (
            <Text className={styles.sectionFilterHint}>（筛选后）</Text>
          )}
        </Text>
        <Text className={styles.sectionCount}>共 {filteredRecords.length} / {records.length} 条</Text>
      </View>

      <View className={styles.recordList}>
        {filteredRecords.length === 0 ? (
          hasActiveFilters ? (
            <View className={styles.emptyState}>
              <View className={styles.emptyIcon}>
                <Text className={styles.emptyIconText}>🔍</Text>
              </View>
              <Text className={styles.emptyTitle}>没有符合筛选条件的记录</Text>
              <Text className={styles.emptyDesc}>试试调整筛选条件，或清除筛选查看全部</Text>
              <View className={styles.practiceBtn} onClick={clearFilters}>
                <Text className={styles.practiceBtnText}>清除筛选</Text>
              </View>
            </View>
          ) : (
            renderEmpty()
          )
        ) : (
          filteredRecords.map(record => {
            const task = getTaskForRecord(record)
            const errorCategories = getResultErrorCategories(record)
            const hasHighlight =
              filters.errorCategories.length > 0 &&
              filters.errorCategories.some(c => errorCategories.includes(c))

            return (
              <View key={record.id} className={styles.recordGroup}>
                <View
                  className={classnames(
                    styles.recordCard,
                    hasHighlight && styles.recordCardHighlight
                  )}
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

                  {errorCategories.length > 0 && (
                    <View className={styles.recordTags}>
                      {errorCategories.slice(0, 4).map(cat => {
                        const isHighlight = filters.errorCategories.includes(cat)
                        return (
                          <View
                            key={cat}
                            className={classnames(
                              styles.recordTag,
                              isHighlight && styles.recordTagHighlight
                            )}
                          >
                            <Text className={styles.recordTagText}>
                              {ERROR_CATEGORY_LABELS[cat]}
                            </Text>
                          </View>
                        )
                      })}
                      {errorCategories.length > 4 && (
                        <View className={styles.recordTag}>
                          <Text className={styles.recordTagText}>+{errorCategories.length - 4}</Text>
                        </View>
                      )}
                    </View>
                  )}

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
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

export default RecordsPage
