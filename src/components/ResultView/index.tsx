import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { PracticeResult, ScoreItem as ScoreItemType, Task, ErrorCategory, ERROR_CATEGORY_LABELS } from '@/types'
import { isHistoricalErrorCorrected } from '@/utils/scorer'
import ScoreItemComponent from '@/components/ScoreItem'
import styles from './index.module.scss'
import classnames from 'classnames'

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m > 0 ? m + '分' : ''}${s}秒`
}

interface ResultViewProps {
  result: PracticeResult
  task?: Task
  showActionBar?: boolean
  onGoRecords?: () => void
  onGoTasks?: () => void
  onRetry?: () => void
  compact?: boolean
  highlightCategories?: ErrorCategory[]
}

const ResultView: React.FC<ResultViewProps> = ({
  result,
  task,
  showActionBar = true,
  onGoRecords,
  onGoTasks,
  onRetry,
  compact = false,
  highlightCategories = []
}) => {
  const borrowItems = useMemo<ScoreItemType[]>(
    () => result.scoreItems.filter(s => s.category === '借出环节'),
    [result]
  )
  const returnItems = useMemo<ScoreItemType[]>(
    () => result.scoreItems.filter(s => s.category === '归还环节'),
    [result]
  )

  const borrowPassed = borrowItems.filter(s => s.passed).length
  const returnPassed = returnItems.filter(s => s.passed).length
  const borrowAllPassed = borrowPassed === borrowItems.length
  const returnAllPassed = returnPassed === returnItems.length

  const hasHighlight = highlightCategories.length > 0

  const shouldHighlight = (item: ScoreItemType): boolean => {
    if (!hasHighlight || !item.errorCategory) return false
    return highlightCategories.includes(item.errorCategory)
  }

  const shouldHighlightError = (category: ErrorCategory): boolean => {
    if (!hasHighlight) return false
    return highlightCategories.includes(category)
  }

  const hasHistoricalErrors =
    result.historicalErrors &&
    (result.historicalErrors.borrow.length > 0 || result.historicalErrors.returned.length > 0)

  return (
    <ScrollView scrollY className={classnames(styles.page, compact && styles.compact)}>
      <View className={styles.resultHeader}>
        <View className={styles.headerInner}>
          <View className={styles.resultBadge}>
            <Text className={styles.resultBadgeText}>
              {result.passed ? '✓ 考核通过' : '✕ 需要加强'}
            </Text>
          </View>
          <Text className={styles.resultTitle}>{result.taskTitle}</Text>
          <Text className={styles.resultSubtitle}>
            {result.aircraftNo} · 完成于 {result.completedAt}
          </Text>

          {hasHighlight && (
            <View className={styles.highlightHint}>
              <Text className={styles.highlightHintText}>
                🎯 已筛选高亮：{highlightCategories.map(c => ERROR_CATEGORY_LABELS[c]).join('、')}
              </Text>
            </View>
          )}

          <View className={styles.scoreBoard}>
            <View className={styles.scoreMain}>
              <Text className={styles.scoreNumber}>{result.passRate}</Text>
              <Text className={styles.scoreUnit}>得分率</Text>
            </View>
            <View className={styles.scoreMeta}>
              <View className={styles.scoreRow}>
                <Text className={styles.scoreRowLabel}>实际得分</Text>
                <Text className={styles.scoreRowValue}>
                  {result.totalScore} / {result.maxScore}
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
                  {borrowItems.length + returnItems.length - (borrowPassed + returnPassed)} 项
                </Text>
              </View>
              <View className={styles.scoreRow}>
                <Text className={styles.scoreRowLabel}>用时</Text>
                <Text className={styles.scoreRowValue}>{formatDuration(result.duration)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {hasHistoricalErrors && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitle}>
                <View className={classnames(styles.titleIcon, styles.titleIconHistory)}>📜</View>
                <Text className={styles.sectionTitleText}>历史错误痕迹</Text>
              </View>
            </View>
            <View className={styles.infoCard}>
              <Text className={styles.historyHint}>
                本次练习过程中曾出现以下错误（即使修改后也会保留痕迹，帮助你复盘学习过程）：
              </Text>
              {result.historicalErrors!.borrow.length > 0 && (
                <View className={styles.historySection}>
                  <Text className={styles.historyLabel}>借出环节曾错：</Text>
                  {result.historicalErrors!.borrow.map((e, idx) => {
                    const corrected = isHistoricalErrorCorrected(
                      e, result.borrowErrors, result.returnErrors
                    )
                    return (
                      <View key={`hb-${idx}`} className={styles.historyItem}>
                        <View className={styles.historyItemHeader}>
                          <Text className={styles.historyBadge}>
                            {ERROR_CATEGORY_LABELS[e.category]}
                          </Text>
                          <View className={classnames(
                            styles.historyStatus,
                            corrected ? styles.historyStatusOk : styles.historyStatusBad
                          )}>
                            <Text className={styles.historyStatusText}>
                              {corrected ? '✓ 后来已改对' : '✕ 最后仍然错着'}
                            </Text>
                          </View>
                        </View>
                        <Text className={styles.historyText}>✕ {e.message}</Text>
                        {corrected && (
                          <Text className={styles.historyCorrectAction}>✓ {e.correctAction}</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
              {result.historicalErrors!.returned.length > 0 && (
                <View className={styles.historySection}>
                  <Text className={styles.historyLabel}>归还环节曾错：</Text>
                  {result.historicalErrors!.returned.map((e, idx) => {
                    const corrected = isHistoricalErrorCorrected(
                      e, result.borrowErrors, result.returnErrors
                    )
                    return (
                      <View key={`hr-${idx}`} className={styles.historyItem}>
                        <View className={styles.historyItemHeader}>
                          <Text className={styles.historyBadge}>
                            {ERROR_CATEGORY_LABELS[e.category]}
                          </Text>
                          <View className={classnames(
                            styles.historyStatus,
                            corrected ? styles.historyStatusOk : styles.historyStatusBad
                          )}>
                            <Text className={styles.historyStatusText}>
                              {corrected ? '✓ 后来已改对' : '✕ 最后仍然错着'}
                            </Text>
                          </View>
                        </View>
                        <Text className={styles.historyText}>✕ {e.message}</Text>
                        {corrected && (
                          <Text className={styles.historyCorrectAction}>✓ {e.correctAction}</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.infoCard}>
            {task && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>周转件名称</Text>
                <Text className={styles.infoValue}>{task.partName}</Text>
              </View>
            )}
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>录入件号</Text>
              <Text className={styles.infoValue}>{result.borrowForm.partNo || '（未填）'}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>录入序号</Text>
              <Text className={styles.infoValue}>{result.borrowForm.serialNo || '（未填）'}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>工卡号</Text>
              <Text className={styles.infoValue}>{result.borrowForm.workCardNo || '（未填）'}</Text>
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
              {borrowPassed}/{borrowItems.length} 正确
            </View>
          </View>
          {borrowItems.map(item => (
            <ScoreItemComponent
              key={item.id}
              item={item}
              highlight={shouldHighlight(item)}
            />
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
              {returnPassed}/{returnItems.length} 正确
            </View>
          </View>
          {returnItems.map(item => (
            <ScoreItemComponent
              key={item.id}
              item={item}
              highlight={shouldHighlight(item)}
            />
          ))}
        </View>

        {(result.borrowErrors.length > 0 || result.returnErrors.length > 0) && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitle}>
                <View className={classnames(styles.titleIcon, styles.titleIconSummary)}>📝</View>
                <Text className={styles.sectionTitleText}>错误点与正确做法</Text>
              </View>
            </View>
            <View className={styles.infoCard}>
              {[...result.borrowErrors, ...result.returnErrors].map((e, idx) => {
                const total = result.borrowErrors.length + result.returnErrors.length
                const isHighlighted = shouldHighlightError(e.category)
                return (
                  <View
                    key={idx}
                    className={classnames(
                      styles.errorSummaryItem,
                      isHighlighted && styles.errorSummaryItemHighlight
                    )}
                    style={{ marginBottom: idx < total - 1 ? '24rpx' : 0 }}
                  >
                    <View className={styles.errorSummaryHeader}>
                      <View className={classnames(
                        styles.errorCategoryBadge,
                        isHighlighted && styles.errorCategoryBadgeHighlight
                      )}>
                        <Text className={styles.errorCategoryText}>
                          {ERROR_CATEGORY_LABELS[e.category]}
                        </Text>
                      </View>
                      {isHighlighted && (
                        <View className={styles.highlightTag}>
                          <Text className={styles.highlightTagText}>🎯 筛选匹配</Text>
                        </View>
                      )}
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>错误点</Text>
                      <Text className={classnames(styles.infoValue, styles.valueBad)}>
                        ✕ {e.message}
                      </Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>正确做法</Text>
                      <Text className={classnames(styles.infoValue, styles.valueGood)}>
                        ✓ {e.correctAction}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        <View style={{ height: showActionBar ? '200rpx' : '48rpx' }} />
      </View>

      {showActionBar && (
        <View className={styles.actionBar}>
          {onGoRecords && (
            <View className={styles.actionBtnSecondary} onClick={onGoRecords}>
              <Text className={styles.actionBtnSecondaryText}>查看历史</Text>
            </View>
          )}
          {onGoTasks && (
            <View className={styles.actionBtnSecondary} onClick={onGoTasks}>
              <Text className={styles.actionBtnSecondaryText}>任务列表</Text>
            </View>
          )}
          {onRetry && (
            <View className={styles.actionBtnPrimary} onClick={onRetry}>
              <Text className={styles.actionBtnPrimaryText}>再练一次</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

export default ResultView
