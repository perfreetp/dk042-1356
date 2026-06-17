import React from 'react'
import { View, Text } from '@tarojs/components'
import { Task } from '@/types'
import { usePractice } from '@/store/PracticeContext'
import { getDifficultyLabel, getStatusLabel, getTaskStats } from '@/utils/scorer'
import styles from './index.module.scss'
import classnames from 'classnames'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onRetry?: () => void
  onViewHistory?: () => void
  selected?: boolean
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onRetry,
  onViewHistory,
  selected
}) => {
  const { state } = usePractice()
  const taskStats = getTaskStats(task.id, state.records)
  const { practiceCount, passCount, recentScore: latestScore, highestScore } = taskStats

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleActionClick = (action: 'retry' | 'history', e: React.MouseEvent) => {
    e.stopPropagation()
    if (action === 'retry' && onRetry) {
      onRetry()
    } else if (action === 'history' && onViewHistory) {
      onViewHistory()
    }
  }

  const difficultyClass = {
    easy: styles.difficultyEasy,
    medium: styles.difficultyMedium,
    hard: styles.difficultyHard
  }[task.difficulty]

  const statusClass = {
    pending: styles.statusPending,
    in_progress: styles.statusInProgress,
    completed: styles.statusCompleted
  }[task.status]

  const passRate = practiceCount > 0 ? Math.round((passCount / practiceCount) * 100) : 0

  return (
    <View
      className={classnames(styles.card, selected && styles.selected)}
      onClick={handleCardClick}
    >
      <View className={styles.cardHeader}>
        <Text className={styles.title}>{task.title}</Text>
        <View className={classnames(styles.difficulty, difficultyClass)}>
          <Text className={styles.difficultyText}>{getDifficultyLabel(task.difficulty)}</Text>
        </View>
      </View>

      <View className={styles.aircraftRow}>
        <View className={styles.aircraftBadge}>
          <Text className={styles.aircraftText}>{task.aircraftNo}</Text>
        </View>
        <Text className={styles.systemText}>{task.system}</Text>
        <View className={classnames(styles.status, statusClass)}>
          <Text className={styles.statusText}>{getStatusLabel(task.status)}</Text>
        </View>
      </View>

      <View className={styles.descriptionWrap}>
        <Text className={styles.description}>{task.description}</Text>
      </View>

      <View className={styles.partInfo}>
        <View className={styles.partItem}>
          <Text className={styles.partLabel}>周转件：</Text>
          <Text className={styles.partValue}>{task.partName}</Text>
        </View>
        <View className={styles.partItem}>
          <Text className={styles.partLabel}>件号：</Text>
          <Text className={styles.partValue}>{task.partNo}</Text>
        </View>
      </View>

      {practiceCount > 0 && (
        <View className={styles.enhancedStats}>
          <View className={styles.statsGrid}>
            <View className={styles.statsCell}>
              <Text className={styles.statsCellValue}>{passCount}</Text>
              <Text className={styles.statsCellLabel}>通过次数</Text>
            </View>
            <View className={styles.statsCell}>
              <Text className={classnames(
                styles.statsCellValue,
                latestScore >= 80 ? styles.valueGood : latestScore >= 60 ? styles.valueWarn : styles.valueBad
              )}>{latestScore !== null ? latestScore : '--'}</Text>
              <Text className={styles.statsCellLabel}>最近分数</Text>
            </View>
            <View className={styles.statsCell}>
              <Text className={classnames(
                styles.statsCellValue,
                styles.valueHighlight
              )}>{highestScore !== null ? highestScore : '--'}</Text>
              <Text className={styles.statsCellLabel}>历史最高</Text>
            </View>
            <View className={styles.statsCell}>
              <Text className={styles.statsCellValue}>{passRate}%</Text>
              <Text className={styles.statsCellLabel}>通过率</Text>
            </View>
          </View>
        </View>
      )}

      {practiceCount > 0 && (
        <View className={styles.actionButtons}>
          <View
            className={classnames(styles.actionBtn, styles.actionBtnSecondary)}
            onClick={(e) => handleActionClick('history', e)}
          >
            <Text className={styles.actionBtnIcon}>📜</Text>
            <Text className={styles.actionBtnTextSecondary}>查看历史</Text>
          </View>
          <View
            className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
            onClick={(e) => handleActionClick('retry', e)}
          >
            <Text className={styles.actionBtnIcon}>🔄</Text>
            <Text className={styles.actionBtnTextPrimary}>直接复练</Text>
          </View>
        </View>
      )}

      {practiceCount === 0 && (
        <View className={styles.footer}>
          <Text className={styles.createdAt}>{task.createdAt}</Text>
          <View className={styles.startBtn}>
            <Text className={styles.startBtnText}>
              {task.status === 'in_progress' ? '继续练习' : '开始练习'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default TaskCard
