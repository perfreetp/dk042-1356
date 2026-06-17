import React from 'react'
import { View, Text, Radio, RadioGroup, Switch, Textarea, ScrollView } from '@tarojs/components'
import { ReturnForm, FieldError, Task, ReturnStatus } from '@/types'
import FormField from '@/components/FormField'
import styles from './index.module.scss'
import classnames from 'classnames'

interface ReturnSectionProps {
  task: Task
  form: ReturnForm
  errors: FieldError[]
  onChange: (form: Partial<ReturnForm>) => void
  onSubmit: () => void
  onBack: () => void
}

const returnStatusOptions: { value: ReturnStatus; label: string; desc: string; color: string }[] = [
  { value: 'serviceable', label: '可用 (Serviceable)', desc: '经检验合格，可再次装机', color: 'success' },
  { value: 'unserviceable', label: '不可用 (Unserviceable)', desc: '故障但未决定送修或报废', color: 'warning' },
  { value: 'awaiting_repair', label: '待修 (Awaiting Repair)', desc: '挂红色待修牌，准备送外修理', color: 'error' },
  { value: 'scrapped', label: '报废 (Scrapped)', desc: '无修复价值，执行报废流程', color: 'gray' }
]

const ReturnSection: React.FC<ReturnSectionProps> = ({ task, form, errors, onChange, onSubmit, onBack }) => {
  const getError = (field: string) => errors.find(e => e.field === field)

  const getColorClass = (color: string, selected: boolean) => {
    if (!selected) return ''
    const map: Record<string, string> = {
      success: styles.optSuccess,
      warning: styles.optWarning,
      error: styles.optError,
      gray: styles.optGray
    }
    return map[color] || ''
  }

  return (
    <View className={styles.wrap}>
      <View className={styles.stageHeader}>
        <View className={styles.stageBadge}>
          <Text className={styles.stageNo}>2</Text>
        </View>
        <View className={styles.stageInfo}>
          <Text className={styles.stageTitle}>归还环节</Text>
          <Text className={styles.stageSubtitle}>拆下件已装机使用，请完成归还入库流程</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.formScroll}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>✓ 借出信息确认</Text>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryKey}>周转件：</Text>
            <Text className={styles.summaryValue}>{task.partName}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryKey}>件号：</Text>
            <Text className={styles.summaryValue}>{task.partNo}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryKey}>序号：</Text>
            <Text className={styles.summaryValue}>{task.serialNo}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryKey}>使用机型：</Text>
            <Text className={styles.summaryValue}>{task.aircraftNo}</Text>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <View className={styles.titleDot} />
          <Text className={styles.titleText}>拆下件状态判定</Text>
        </View>

        <FormField
          label="选择拆下件状态"
          required
          hint="结合故障描述综合判断"
          error={getError('partStatus')}
        >
          <RadioGroup onChange={(e) => onChange({ partStatus: e.detail.value as ReturnStatus })}>
            <View className={styles.optionsList}>
              {returnStatusOptions.map((opt) => {
                const selected = form.partStatus === opt.value
                return (
                  <View
                    key={opt.value}
                    className={classnames(
                      styles.optionCard,
                      selected && styles.optionSelected,
                      getColorClass(opt.color, selected)
                    )}
                  >
                    <View className={styles.optionMain}>
                      <Radio
                        value={opt.value}
                        checked={selected}
                        color={
                          opt.color === 'success'
                            ? '#10B981'
                            : opt.color === 'warning'
                              ? '#F59E0B'
                              : opt.color === 'error'
                                ? '#EF4444'
                                : '#1E5AA8'
                        }
                      />
                      <View className={styles.optionTextWrap}>
                        <Text className={styles.optionLabel}>{opt.label}</Text>
                        <Text className={styles.optionDesc}>{opt.desc}</Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </RadioGroup>
        </FormField>

        <View className={styles.sectionTitle}>
          <View className={styles.titleDot} />
          <Text className={styles.titleText}>入库前检查</Text>
        </View>

        <FormField
          label="是否悬挂待修牌"
          required
          hint="红色 AOG 待修牌填写完整信息"
          error={getError('hasRepairTag')}
        >
          <View className={styles.switchRow}>
            <Text className={styles.switchLabel}>
              {form.hasRepairTag ? '已悬挂红色待修牌，标注件号/序号/故障' : '未悬挂待修牌'}
            </Text>
            <Switch
              checked={form.hasRepairTag}
              onChange={(e) => onChange({ hasRepairTag: e.detail.value })}
              color="#EF4444"
            />
          </View>
          {form.hasRepairTag && (
            <View className={styles.tagPreview}>
              <View className={styles.repairTag}>
                <Text className={styles.tagTop}>AOG 待修</Text>
                <Text className={styles.tagLine}>件号：{task.partNo}</Text>
                <Text className={styles.tagLine}>序号：{task.serialNo}</Text>
                <Text className={styles.tagLine}>故障：渗漏 / 已记录</Text>
              </View>
            </View>
          )}
        </FormField>

        <FormField
          label="附件是否齐套"
          required
          hint="对照附件清单：封圈、螺栓、垫片等"
          error={getError('accessoriesComplete')}
        >
          <View className={styles.switchRow}>
            <Text className={styles.switchLabel}>
              {form.accessoriesComplete ? '已核对清单，附件齐全' : '缺少部分附件'}
            </Text>
            <Switch
              checked={form.accessoriesComplete}
              onChange={(e) => onChange({ accessoriesComplete: e.detail.value })}
              color="#10B981"
            />
          </View>
          {form.accessoriesComplete && (
            <View className={styles.checklist}>
              <View className={styles.checkItem}>
                <Text className={styles.checkOk}>✓</Text>
                <Text className={styles.checkText}>O 形密封圈 × 2</Text>
              </View>
              <View className={styles.checkItem}>
                <Text className={styles.checkOk}>✓</Text>
                <Text className={styles.checkText}>安装螺栓 × 6</Text>
              </View>
              <View className={styles.checkItem}>
                <Text className={styles.checkOk}>✓</Text>
                <Text className={styles.checkText}>平垫片 × 6</Text>
              </View>
            </View>
          )}
        </FormField>

        <FormField label="归还备注" hint="选填：特殊情况说明">
          <Textarea
            className={styles.textarea}
            placeholder="填写补充说明，如外观损伤、特殊标识等"
            placeholderClass={styles.placeholder}
            value={form.returnRemarks}
            onInput={(e) => onChange({ returnRemarks: e.detail.value })}
            maxlength={200}
            showConfirmBar={false}
          />
        </FormField>

        <View className={styles.bottomPadding} />
      </ScrollView>

      <View className={styles.footerBar}>
        <View className={styles.backBtn} onClick={onBack}>
          <Text className={styles.backText}>← 返回借出</Text>
        </View>
        <View className={styles.submitBtn} onClick={onSubmit}>
          <Text className={styles.submitText}>提交评分</Text>
        </View>
      </View>
    </View>
  )
}

export default ReturnSection
