import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Task, TaskStatus, ErrorCategory } from '@/types'
import { usePractice } from '@/store/PracticeContext'
import { getTaskStats } from '@/utils/scorer'
import TaskCard from '@/components/TaskCard'
import TrainingReportView from '@/components/TrainingReportView'
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
  const [showReport, setShowReport] = useState(false)
  const { selectTask, state, setRecordsFilter } = usePractice()
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

  const handleStartPractice = (task: Task) => {
    console.log('[Tasks] 开始练习:', task.id, task.title)
    selectTask(task)
    Taro.switchTab({
      url: '/pages/practice/index'
    })
  }

  const handleRetry = (task: Task) => {
    console.log('[Tasks] 复练任务:', task.id, task.title)
    selectTask(task)
    Taro.switchTab({
      url: '/pages/practice/index'
    })
  }

  const handleViewHistory = (task: Task) => {
    console.log('[Tasks] 查看历史:', task.id, task.title)
    setRecordsFilter({ taskId: task.id, errorCategories: [] })
    Taro.switchTab({
      url: '/pages/records/index'
    })
  }

  const handleViewErrorDetail = (category: ErrorCategory) => {
    console.log('[Tasks] 查看错误详情:', category)
    setRecordsFilter({ taskId: 'all', errorCategories: [category] })
    setShowReport(false)
    Taro.switchTab({
      url: '/pages/records/index'
    })
  }

  const handleRetryTaskFromReport = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setShowReport(false)
      handleRetry(task)
    }
  }

  const handleViewTaskHistoryFromReport = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      handleViewHistory(task)
    }
  }

  const handleCardClick = (task: Task) => {
    const taskStats = getTaskStats(task.id, records)
    if (taskStats.practiceCount === 0) {
      handleStartPractice(task)
    } else {
      Taro.showActionSheet({
        itemList: ['🔄 直接复练', '📜 查看历史成绩'],
        success: (res) => {
          if (res.tapIndex === 0) {
            handleRetry(task)
          } else if (res.tapIndex === 1) {
            handleViewHistory(task)
          }
        }
      })
    }
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

        {records.length > 0 && (
          <View className={styles.reportEntry} onClick={() => setShowReport(true)}>
            <View className={styles.reportEntryLeft}>
              <View className={styles.reportEntryIcon}>
                <Text className={styles.reportEntryIconText}>📊</Text>
              </View>
              <View className={styles.reportEntryText}>
                <Text className={styles.reportEntryTitle}>训练报告</Text>
                <Text className={styles.reportEntrySub}>
                  查看近7天和全部历史训练数据，发现薄弱环节，推荐复练任务
                </Text>
              </View>
            </View>
            <View className={styles.reportEntryArrow}>
              <Text className={styles.reportEntryArrowText}>→</Text>
            </View>
          </View>
        )}
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
              onClick={() => handleCardClick(task)}
              onRetry={() => handleRetry(task)}
              onViewHistory={() => handleViewHistory(task)}
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

      {showReport && records.length > 0 && (
        <TrainingReportView
          records={records}
          tasks={tasks}
          onClose={() => setShowReport(false)}
          onRetryTask={handleRetryTaskFromReport}
          onViewTaskHistory={handleViewTaskHistoryFromReport}
          onViewErrorDetail={handleViewErrorDetail}
        />
      )}
    </ScrollView>
  )
}

export default TasksPage
