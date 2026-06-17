import React from 'react'
import { View, Text } from '@tarojs/components'
import { FieldError, ERROR_CATEGORY_LABELS } from '@/types'
import styles from './index.module.scss'
import classnames from 'classnames'

interface ConfirmDialogProps {
  title: string
  description: string
  errors: FieldError[]
  onConfirm: () => void
  onBack: () => void
  confirmText?: string
  backText?: string
  type: 'borrow' | 'return'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  errors,
  onConfirm,
  onBack,
  confirmText = '带着错误继续',
  backText = '返回修改',
  type
}) => {
  return (
    <View className={styles.confirmDialog}>
      <View className={styles.confirmHeader}>
        <View className={classnames(
          styles.confirmIcon,
          type === 'borrow' ? styles.confirmIconBorrow : styles.confirmIconReturn
        )}>
          <Text className={styles.confirmIconText}>⚠</Text>
        </View>
        <Text className={styles.confirmTitle}>{title}</Text>
        <Text className={styles.confirmDesc}>{description}</Text>
      </View>

      <View className={styles.errorListHeader}>
        <Text className={styles.errorListTitle}>发现 {errors.length} 项问题</Text>
        <Text className={styles.errorListHint}>点击返回可修改，继续则保留错误计入成绩单</Text>
      </View>

      <View className={styles.errorList}>
        {errors.map((error, index) => {
          const categoryLabel = ERROR_CATEGORY_LABELS[error.category] || '其他'
          return (
            <View key={index} className={styles.errorCard}>
              <View className={styles.errorCardHeader}>
                <View className={styles.errorBadge}>
                  <Text className={styles.errorBadgeText}>{categoryLabel}</Text>
                </View>
                <Text className={styles.errorIndex}>问题 {index + 1}</Text>
              </View>
              <View className={styles.errorRow}>
                <Text className={styles.errorLabel}>错误点</Text>
                <Text className={classnames(styles.errorValue, styles.errorValueBad)}>
                  ✕ {error.message}
                </Text>
              </View>
              <View className={styles.errorRow}>
                <Text className={styles.errorLabel}>正确做法</Text>
                <Text className={classnames(styles.errorValue, styles.errorValueGood)}>
                  ✓ {error.correctAction}
                </Text>
              </View>
            </View>
          )
        })}
      </View>

      <View className={styles.confirmActions}>
        <View className={styles.backBtn} onClick={onBack}>
          <Text className={styles.backBtnText}>{backText}</Text>
        </View>
        <View className={styles.confirmBtn} onClick={onConfirm}>
          <Text className={styles.confirmBtnText}>{confirmText}</Text>
        </View>
      </View>
    </View>
  )
}

export default ConfirmDialog
