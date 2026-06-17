import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Task, TaskStatus } from '@/types'
import { usePractice } from '@/store/PracticeContext'
import TaskCard from '@/components/TaskCard'
import styles from './index.module.scss'
import classnames from 'classnames'

type FilterType = 'all' | TaskStatus

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待练习' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' }
]

const TasksPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all')
  const { selectTask, state } = usePractice()
  const { tasks, records } = state

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks
    return tasks.filter(t => t.status === filter)
  }, [tasks, filter])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const recordCount = records.length
    const avgScore = recordCount > 0
      ? Math.round(records.reduce((s, r) => s + r.passRate, 0) / recordCount)
      : 0
    return { total, completed, records: recordCount, avgScore }
  }, [tasks, records])

  const handleSelectTask = (task: Task) => {
    console.log('[Tasks] 选择任务:', task.id, task.title, '当前状态:', task.status)
    selectTask(task)
    Taro.switchTab({
      url: '/pages/practice/index'
    })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.topBar}>
          <View className={styles.brand}>
            <View className={styles.brandIcon}>
              <Text className={styles.brandIconText}>✈</Text>
            </View>
            <View className={styles.brandText}>
              <Text className={styles.brandName}>航材借还模拟</Text>
              <Text className={styles.brandSub}>航空维修培训系统</Text>
            </View>
          </View>
          <View className={styles.statsBadge}>
            <Text className={styles.statsBadgeText}>通过率 {stats.avgScore || '--'}%</Text>
          </View>
        </View>

        <View className={styles.welcome}>
          <Text className={styles.welcomeTitle}>欢迎，航材学徒</Text>
          <Text className={styles.welcomeSub}>
            通过任务卡形式练习周转件「借、用、还、追」的标准流程，熟练后独立上岗。
          </Text>
          <View className={styles.quickStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.total}</Text>
              <Text className={styles.statLabel}>总任务</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.completed}</Text>
              <Text className={styles.statLabel}>已完成</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.records}</Text>
              <Text className={styles.statLabel}>练习次数</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filterOptions.map(opt => (
          <View
            key={opt.value}
            className={classnames(styles.filterBtn, filter === opt.value && styles.filterBtnActive)}
            onClick={() => setFilter(opt.value)}
          >
            <Text className={styles.filterBtnText}>{opt.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>训练任务卡</Text>
        <Text className={styles.sectionCount}>共 {filteredTasks.length} 项</Text>
      </View>

      <View className={styles.taskList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => handleSelectTask(task)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>
              <Text className={styles.emptyIconText}>📋</Text>
            </View>
            <Text className={styles.emptyText}>该分类下暂无任务</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default TasksPage
