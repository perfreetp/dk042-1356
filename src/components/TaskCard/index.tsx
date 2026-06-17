import React from 'react'
import { View, Text } from '@tarojs/components'
import { Task } from '@/types'
import { usePractice } from '@/store/PracticeContext'
import { getDifficultyLabel, getStatusLabel } from '@/utils/scorer'
import styles from './index.module.scss'
import classnames from 'classnames'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  selected?: boolean
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, selected }) => {
  const { state } = usePractice()
  const taskRecords = state.records.filter(r => r.taskId === task.id)
  const practiceCount = taskRecords.length
  const avgScore =
    practiceCount > 0
      ? Math.round(taskRecords.reduce((s, r) => s + r.passRate, 0) / practiceCount)
      : 0

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

  return (
    <View
      className={classnames(styles.card, selected && styles.selected)}
      onClick={onClick}
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
        <View className={styles.statsRow}>
          <View className={styles.statBadge}>
            <Text className={styles.statBadgeText}>练习 {practiceCount} 次</Text>
          </View>
          <View className={classnames(
            styles.statBadge,
            avgScore >= 80 ? styles.statBadgeOk : styles.statBadgeWarn
          )}>
            <Text className={styles.statBadgeText}>平均分 {avgScore}</Text>
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.createdAt}>{task.createdAt}</Text>
        <View className={styles.actionBtn}>
          <Text className={styles.actionText}>
            {task.status === 'completed'
              ? practiceCount > 1
                ? '再练一次'
                : '查看/复练'
              : task.status === 'in_progress'
                ? '继续练习'
                : '开始练习'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default TaskCard
