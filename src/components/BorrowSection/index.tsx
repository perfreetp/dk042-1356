import React from 'react'
import { View, Text, Input, Switch, ScrollView } from '@tarojs/components'
import { BorrowForm, FieldError, Task } from '@/types'
import FormField from '@/components/FormField'
import styles from './index.module.scss'
import classnames from 'classnames'

interface BorrowSectionProps {
  task: Task
  form: BorrowForm
  errors: FieldError[]
  onChange: (form: Partial<BorrowForm>) => void
  onSubmit: () => void
}

const BorrowSection: React.FC<BorrowSectionProps> = ({ task, form, errors, onChange, onSubmit }) => {
  const getError = (field: string) => errors.find(e => e.field === field)

  const partStatusOptions = [
    { label: '新件（首次使用）', value: 'new' },
    { label: '在用周转件', value: 'used' }
  ]

  return (
    <View className={styles.wrap}>
      <View className={styles.stageHeader}>
        <View className={styles.stageBadge}>
          <Text className={styles.stageNo}>1</Text>
        </View>
        <View className={styles.stageInfo}>
          <Text className={styles.stageTitle}>借出环节</Text>
          <Text className={styles.stageSubtitle}>请核对周转件信息并完成适航审查</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.formScroll}>
        <View className={styles.taskCard}>
          <Text className={styles.taskLabel}>任务卡</Text>
          <Text className={styles.taskDesc}>{task.description}</Text>
          <View className={styles.taskMeta}>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>机型：</Text>
              <Text className={styles.metaValue}>{task.aircraftNo}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>系统：</Text>
              <Text className={styles.metaValue}>{task.system}</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <View className={styles.titleDot} />
          <Text className={styles.titleText}>基本信息录入</Text>
        </View>

        <FormField
          label="周转件件号 (Part Number)"
          required
          hint="请按实物标签填写"
          error={getError('partNo')}
        >
          <Input
            className={styles.input}
            placeholder="例如: P/N 361-011-001"
            placeholderClass={styles.placeholder}
            value={form.partNo}
            onInput={(e) => onChange({ partNo: e.detail.value })}
          />
        </FormField>

        <FormField
          label="周转件序号 (Serial Number)"
          required
          hint="一物一号，确保可追溯"
          error={getError('serialNo')}
        >
          <Input
            className={styles.input}
            placeholder="例如: S/N HP-2025-0892"
            placeholderClass={styles.placeholder}
            value={form.serialNo}
            onInput={(e) => onChange({ serialNo: e.detail.value })}
          />
        </FormField>

        <View className={styles.sectionTitle}>
          <View className={styles.titleDot} />
          <Text className={styles.titleText}>适航与文件审查</Text>
        </View>

        <FormField
          label="是否附带有效适航标签"
          required
          hint="装机件需具备 8130-3 / Form 1"
          error={getError('hasAirworthinessTag')}
        >
          <View className={styles.switchRow}>
            <Text className={styles.switchLabel}>
              {form.hasAirworthinessTag ? '已确认具备有效适航标签' : '未具备适航标签'}
            </Text>
            <Switch
              checked={form.hasAirworthinessTag}
              onChange={(e) => onChange({ hasAirworthinessTag: e.detail.value })}
              color="#1E5AA8"
            />
          </View>
          <View className={styles.tagPreview}>
            <View className={classnames(styles.tagSample, form.hasAirworthinessTag && styles.tagValid)}>
              <Text className={styles.tagName}>FAA 8130-3</Text>
              <Text className={styles.tagStatus}>{form.hasAirworthinessTag ? '✓ 有效' : '缺失'}</Text>
            </View>
            <View className={classnames(styles.tagSample, form.hasAirworthinessTag && styles.tagValid)}>
              <Text className={styles.tagName}>EASA Form 1</Text>
              <Text className={styles.tagStatus}>{form.hasAirworthinessTag ? '✓ 有效' : '缺失'}</Text>
            </View>
          </View>
        </FormField>

        <FormField
          label="是否附带拆装记录"
          required
          hint="高价值件需记录拆下时间与原因"
          error={getError('hasDisassemblyRecord')}
        >
          <View className={styles.switchRow}>
            <Text className={styles.switchLabel}>
              {form.hasDisassemblyRecord ? '已检查拆装记录完整' : '缺少拆装记录'}
            </Text>
            <Switch
              checked={form.hasDisassemblyRecord}
              onChange={(e) => onChange({ hasDisassemblyRecord: e.detail.value })}
              color="#1E5AA8"
            />
          </View>
          {form.hasDisassemblyRecord && (
            <View className={styles.recordBox}>
              <View className={styles.recordRow}>
                <Text className={styles.recordLabel}>拆下时间：</Text>
                <Text className={styles.recordValue}>已记录</Text>
              </View>
              <View className={styles.recordRow}>
                <Text className={styles.recordLabel}>拆下原因：</Text>
                <Text className={styles.recordValue}>已记录</Text>
              </View>
            </View>
          )}
        </FormField>

        <FormField
          label="关联工卡号"
          required={task.needWorkCardNo}
          hint="格式: WC-YYYYMMDD-XXX"
          error={getError('workCardNo')}
        >
          <Input
            className={styles.input}
            placeholder="例如: WC-20260615-001"
            placeholderClass={styles.placeholder}
            value={form.workCardNo}
            onInput={(e) => onChange({ workCardNo: e.detail.value })}
          />
        </FormField>

        <View className={styles.bottomPadding} />
      </ScrollView>

      <View className={styles.footerBar}>
        <View className={styles.submitBtn} onClick={onSubmit}>
          <Text className={styles.submitText}>确认借出，进入归还环节 →</Text>
        </View>
      </View>
    </View>
  )
}

export default BorrowSection
