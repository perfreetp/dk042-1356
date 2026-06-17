import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import {
  TrainingReport,
  ErrorCategory,
  ERROR_CATEGORY_LABELS,
  Task,
  PracticeResult
} from '@/types'
import { safeGenerateTrainingReport } from '@/utils/scorer'
import styles from './index.module.scss'
import classnames from 'classnames'

interface TrainingReportViewProps {
  records: PracticeResult[]
  tasks: Task[]
  onClose: () => void
  onRetryTask: (taskId: string) => void
  onViewTaskHistory: (taskId: string) => void
  onViewErrorDetail?: (category: ErrorCategory) => void
}

const PERIOD_OPTIONS = [
  { value: 7, label: '近7天' },
  { value: 0, label: '全部历史' }
]

const TrainingReportView: React.FC<TrainingReportViewProps> = ({
  records,
  tasks,
  onClose,
  onRetryTask,
  onViewTaskHistory,
  onViewErrorDetail
}) => {
  const [periodDays, setPeriodDays] = useState(7)

  const report = useMemo<TrainingReport>(() => {
    return safeGenerateTrainingReport(records, tasks, periodDays)
  }, [records, tasks, periodDays])

  const getCategoryIcon = (category: ErrorCategory): string => {
    const iconMap: Record<ErrorCategory, string> = {
      missing_serial_no: '🔢',
      missing_airworthiness_tag: '📋',
      missing_disassembly_record: '📝',
      missing_work_card_no: '📑',
      missing_repair_tag: '🏷️',
      wrong_part_status: '🔴',
      incomplete_accessories: '🔧',
      format_error: '⚠️',
      other: '❓'
    }
    return iconMap[category] || '❓'
  }

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info'): string => {
    const colorMap = {
      critical: '#EF4444',
      warning: '#F59E0B',
      info: '#0EA5E9'
    }
    return colorMap[severity]
  }

  const getSeverityLabel = (severity: 'critical' | 'warning' | 'info'): string => {
    const labelMap = {
      critical: '高危',
      warning: '需关注',
      info: '需改进'
    }
    return labelMap[severity]
  }

  const handleErrorClick = (category: ErrorCategory) => {
    if (onViewErrorDetail) {
      onViewErrorDetail(category)
      onClose()
    }
  }

  const formatPeriodLabel = (): string => {
    return periodDays === 0 ? '全部历史' : `近${periodDays}天`
  }

  return (
    <View className={styles.overlay} onClick={onClose}>
      <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <View className={styles.header}>
          <View className={styles.headerTitle}>
            <Text className={styles.headerIcon}>📊</Text>
            <View>
              <Text className={styles.headerTitleText}>训练分析报告</Text>
              <Text className={styles.headerSub}>{formatPeriodLabel()} · {report.totalPractices}次练习</Text>
            </View>
          </View>
          <View className={styles.closeBtn} onClick={onClose}>
            <Text className={styles.closeBtnText}>✕</Text>
          </View>
        </View>

        <View className={styles.periodTabs}>
          {PERIOD_OPTIONS.map(opt => (
            <View
              key={opt.value}
              className={classnames(
                styles.periodTab,
                periodDays === opt.value && styles.periodTabActive
              )}
              onClick={() => setPeriodDays(opt.value)}
            >
              <Text className={classnames(
                styles.periodTabText,
                periodDays === opt.value && styles.periodTabTextActive
              )}>{opt.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView scrollY className={styles.content}>
          <View className={styles.overview}>
            <View className={styles.overviewHeader}>
              <Text className={styles.overviewTitle}>训练概览</Text>
              <Text className={styles.overviewSub}>生成于 {report.generatedAt}</Text>
            </View>
            <View className={styles.overviewGrid}>
              <View className={styles.overviewCell}>
                <Text className={styles.overviewValue}>{report.totalPractices}</Text>
                <Text className={styles.overviewLabel}>总练习次数</Text>
              </View>
              <View className={styles.overviewCell}>
                <Text className={classnames(
                  styles.overviewValue,
                  report.overallPassRate >= 80 ? styles.valueGood :
                  report.overallPassRate >= 60 ? styles.valueWarn : styles.valueBad
                )}>{report.overallPassRate}%</Text>
                <Text className={styles.overviewLabel}>平均得分率</Text>
              </View>
              <View className={styles.overviewCell}>
                <Text className={styles.overviewValue}>{report.uniqueTasksPracticed}</Text>
                <Text className={styles.overviewLabel}>练习任务数</Text>
              </View>
              <View className={styles.overviewCell}>
                <Text className={styles.overviewValue}>{report.totalErrors}</Text>
                <Text className={styles.overviewLabel}>累计错误数</Text>
              </View>
            </View>
          </View>

          {report.topErrors.length > 0 && (
            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>高频错误 TOP5</Text>
                <Text className={styles.sectionSub}>点击查看详情</Text>
              </View>
              {report.topErrors.map((item, index) => (
                <View
                  key={item.category}
                  className={classnames(
                    styles.errorItem,
                    onViewErrorDetail && styles.errorItemClickable
                  )}
                  onClick={() => handleErrorClick(item.category)}
                >
                  <View className={styles.errorRank}>
                    <Text className={styles.errorRankText}>{index + 1}</Text>
                  </View>
                  <View className={styles.errorIcon}>
                    <Text className={styles.errorIconText}>{getCategoryIcon(item.category)}</Text>
                  </View>
                  <View className={styles.errorInfo}>
                    <View className={styles.errorTopRow}>
                      <Text className={styles.errorName}>{ERROR_CATEGORY_LABELS[item.category]}</Text>
                      <View className={classnames(
                        styles.severityBadge,
                        item.severity === 'critical' && styles.severityCritical,
                        item.severity === 'warning' && styles.severityWarning,
                        item.severity === 'info' && styles.severityInfo
                      )}>
                        <Text className={styles.severityText}>
                          {getSeverityLabel(item.severity)}
                        </Text>
                      </View>
                    </View>
                    <Text className={styles.errorCount}>
                      出现 {item.count} 次 · 涉及 {item.relatedTaskIds.length} 个任务
                    </Text>
                    <View className={styles.errorProgress}>
                      <View
                        className={styles.errorProgressBar}
                        style={{
                          width: `${Math.min(100, (item.count / report.topErrors[0].count) * 100)}%`,
                          background: getSeverityColor(item.severity)
                        }}
                      />
                    </View>
                    <Text className={styles.errorHint}>💡 {item.suggestion}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {report.weakPoints.length > 0 && (
            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>薄弱环节分析</Text>
                <Text className={styles.sectionSub}>需要重点加强</Text>
              </View>
              {report.weakPoints.map((point, idx) => (
                <View key={idx} className={styles.weakPointItem}>
                  <View className={styles.weakPointIcon}>
                    <Text className={styles.weakPointIconText}>⚠️</Text>
                  </View>
                  <View className={styles.weakPointInfo}>
                    <Text className={styles.weakPointTitle}>{point.title}</Text>
                    <Text className={styles.weakPointDesc}>{point.description}</Text>
                    <View className={styles.weakPointTags}>
                      {point.relatedCategories.map(cat => (
                        <View key={cat} className={styles.weakPointTag}>
                          <Text className={styles.weakPointTagText}>
                            {ERROR_CATEGORY_LABELS[cat]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {report.recommendedTasks.length > 0 && (
            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>建议复练任务</Text>
                <Text className={styles.sectionSub}>针对性强化训练</Text>
              </View>
              {report.recommendedTasks.map((rec) => (
                <View key={rec.taskId} className={styles.recommendItem}>
                  <View className={styles.recommendInfo}>
                    <Text className={styles.recommendTitle}>{rec.taskTitle}</Text>
                    <Text className={styles.recommendReason}>{rec.reason}</Text>
                  </View>
                  <View className={styles.recommendMetaRow}>
                    <Text className={styles.recommendScore}>
                      通过率 {rec.passRate}%
                    </Text>
                    <View className={styles.recommendActions}>
                      <View
                        className={styles.recommendBtnSecondary}
                        onClick={() => onViewTaskHistory(rec.taskId)}
                      >
                        <Text className={styles.recommendBtnSecondaryText}>查看历史</Text>
                      </View>
                      <View
                        className={styles.recommendBtnPrimary}
                        onClick={() => onRetryTask(rec.taskId)}
                      >
                        <Text className={styles.recommendBtnPrimaryText}>立即复练</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: '48rpx' }} />
        </ScrollView>
      </View>
    </View>
  )
}

export default TrainingReportView
