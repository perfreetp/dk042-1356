import React from 'react'
import { View, Text } from '@tarojs/components'
import { FieldError } from '@/types'
import styles from './index.module.scss'
import classnames from 'classnames'

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: FieldError
  children: React.ReactNode
}

const FormField: React.FC<FormFieldProps> = ({ label, required, hint, error, children }) => {
  return (
    <View className={classnames(styles.wrap, error && styles.hasError)}>
      <View className={styles.labelRow}>
        <Text className={styles.label}>
          {required && <Text className={styles.requiredMark}>* </Text>}
          {label}
        </Text>
        {hint && <Text className={styles.hint}>{hint}</Text>}
      </View>

      <View className={classnames(styles.control, error && styles.controlError)}>
        {children}
      </View>

      {error && (
        <View className={styles.errorBox}>
          <View className={styles.errorHeader}>
            <Text className={styles.errorIcon}>✕</Text>
            <Text className={styles.errorMsg}>{error.message}</Text>
          </View>
          <View className={styles.correctBox}>
            <Text className={styles.correctIcon}>✓</Text>
            <Text className={styles.correctText}>{error.correctAction}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default FormField
