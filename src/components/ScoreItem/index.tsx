import React from 'react'
import { View, Text } from '@tarojs/components'
import { ScoreItem as ScoreItemType } from '@/types'
import styles from './index.module.scss'
import classnames from 'classnames'

interface ScoreItemProps {
  item: ScoreItemType
  showDetail?: boolean
  highlight?: boolean
}

const ScoreItemComponent: React.FC<ScoreItemProps> = ({ item, showDetail = true, highlight = false }) => {
  return (
    <View className={classnames(
      styles.wrap,
      item.passed ? styles.passed : styles.failed,
      highlight && styles.highlight
    )}>
      <View className={styles.header}>
        <View className={styles.iconWrap}>
          <Text className={classnames(styles.icon, item.passed ? styles.iconOk : styles.iconBad)}>
            {item.passed ? '✓' : '✕'}
          </Text>
        </View>
        <View className={styles.headerMain}>
          <View className={styles.topRow}>
            <Text className={styles.category}>{item.category}</Text>
            <View className={classnames(styles.scoreBadge, item.passed ? styles.scoreOk : styles.scoreBad)}>
              <Text className={styles.scoreText}>
                {item.score}/{item.maxScore}
              </Text>
            </View>
          </View>
          <Text className={styles.description}>{item.description}</Text>
        </View>
      </View>

      {showDetail && (
        <View className={styles.detail}>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>你的答案：</Text>
            <Text className={classnames(styles.detailValue, item.passed ? styles.valueOk : styles.valueBad)}>
              {item.userAnswer}
            </Text>
          </View>
          {!item.passed && (
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>正确答案：</Text>
              <Text className={styles.detailCorrect}>{item.correctAnswer}</Text>
            </View>
          )}
          <View className={styles.feedbackBox}>
            <Text className={styles.feedbackIcon}>💡</Text>
            <Text className={styles.feedbackText}>{item.feedback}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default ScoreItemComponent
