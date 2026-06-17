import React from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { TrainingReport, ERROR_CATEGORY_LABELS, Task } from '@/types'
import styles from './index.module.scss'
import classnames from 'classnames'

interface TrainingReportViewProps {
  report: TrainingReport
  onClose: () => void
  onRetryTask: (taskId: string) => void
  onViewTaskHistory: (taskId: string) => void
}

const TrainingReportView: React.FC<TrainingReportViewProps> = ({
  report,
  onClose,
  onRetryTask,
  onViewTaskHistory
}) => {
  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
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

  return (
    <View className={styles.overlay} onClick={onClose}>
      <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <View className={styles.header}>
          <View className={styles.headerTitle}>
            <Text className={styles.headerIcon}>📊</Text>
            <View>
              <Text className={styles.headerTitleText}>训练分析报告</Text>
              <Text className={styles.headerSub}>{report.periodDays}天训练汇总</Text>
            </View>
          </View>
          <View className={styles.closeBtn} onClick={onClose}>
            <Text className={styles.closeBtnText}>✕</Text>
          </View>
        </View>

        <ScrollView scrollY className={styles.content}>
          <View className={styles.overview}>
            <View className={styles.overviewHeader}>
              <Text className={styles.sectionTitle}>训练概览</Text>
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
                <Text className={styles.overviewLabel}>整体通过率</Text>
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
                <Text className={styles.sectionSub}>最常出现的错误类型</Text>
              </View>
              {report.topErrors.map((item, index) => (
                <View key={item.category} className={styles.errorItem}>
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
                    <Text className={styles.errorCount}>出现 {item.count} 次 · 涉及 {item.affectedTasks.length} 个任务</Text>
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
                    <View className={styles.recommendMeta}>
                      <Text className={styles.recommendReason}>{rec.reason}</Text>
                    </View>
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
                        <Text className={styles.recommendBtnPrimaryText}>复练</Text>
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
