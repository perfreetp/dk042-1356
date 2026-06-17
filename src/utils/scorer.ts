import {
  Task,
  BorrowForm,
  ReturnForm,
  FieldError,
  ScoreItem,
  PracticeResult,
  ErrorCategory,
  TrainingReport,
  ErrorFrequencyItem,
  TaskRecommendation,
  TaskStats
} from '@/types'

const fieldToErrorCategory: Record<string, ErrorCategory> = {
  'serialNo-missing': 'missing_serial_no',
  'serialNo-format': 'missing_serial_no',
  'hasAirworthinessTag': 'missing_airworthiness_tag',
  'hasDisassemblyRecord': 'missing_disassembly_record',
  'workCardNo-missing': 'missing_work_card_no',
  'workCardNo-format': 'missing_work_card_no',
  'partStatus': 'wrong_part_status',
  'hasRepairTag': 'missing_repair_tag',
  'accessoriesComplete': 'incomplete_accessories',
  'partNo': 'format_error'
}

const getErrorCategory = (field: string, type: string): ErrorCategory => {
  const key = `${field}-${type}`
  return fieldToErrorCategory[key] || fieldToErrorCategory[field] || 'other'
}

export const validateBorrowForm = (form: BorrowForm, task: Task): FieldError[] => {
  const errors: FieldError[] = []

  if (!form.partNo.trim()) {
    errors.push({
      field: 'partNo',
      type: 'missing',
      category: getErrorCategory('partNo', 'missing'),
      message: '请录入件号，件号是定位周转件的基础信息',
      correctAction: `请录入正确件号：${task.partNo}`
    })
  } else if (form.partNo.trim() !== task.partNo) {
    errors.push({
      field: 'partNo',
      type: 'format',
      category: getErrorCategory('partNo', 'format'),
      message: '件号与任务单不匹配，请核对实物标签',
      correctAction: `正确件号为 ${task.partNo}，请核对周转件实物标签上的件号`
    })
  }

  if (!form.serialNo.trim()) {
    errors.push({
      field: 'serialNo',
      type: 'missing',
      category: getErrorCategory('serialNo', 'missing'),
      message: '只填件号无法锁定实物，请补录序号',
      correctAction: `扫描或录入序号：${task.serialNo}，一物一号确保可追溯`
    })
  } else if (form.serialNo.trim() !== task.serialNo) {
    errors.push({
      field: 'serialNo',
      type: 'format',
      category: getErrorCategory('serialNo', 'format'),
      message: '序号不存在或件号序号不匹配，请检查录入',
      correctAction: `正确序号为 ${task.serialNo}，请核对实物铭牌`
    })
  }

  if (task.needAirworthinessTag && !form.hasAirworthinessTag) {
    errors.push({
      field: 'hasAirworthinessTag',
      type: 'wrong_choice',
      category: getErrorCategory('hasAirworthinessTag', 'wrong_choice'),
      message: '该周转件装机使用必须具备适航标签（FAA/EASA/CAAC）',
      correctAction: '请确认周转件附带有效的适航批准标签（如FAA 8130-3、EASA Form 1等）'
    })
  }

  if (!task.needAirworthinessTag && form.hasAirworthinessTag) {
    errors.push({
      field: 'hasAirworthinessTag',
      type: 'wrong_choice',
      category: getErrorCategory('hasAirworthinessTag', 'wrong_choice'),
      message: '此类周转件（标准件/装饰件）无需适航标签，过度检查会降低效率',
      correctAction: '客舱装饰件、标准紧固件等无需适航标签，可直接借出'
    })
  }

  if (task.needDisassemblyRecord && !form.hasDisassemblyRecord) {
    errors.push({
      field: 'hasDisassemblyRecord',
      type: 'wrong_choice',
      category: getErrorCategory('hasDisassemblyRecord', 'wrong_choice'),
      message: '该件拆下时须附拆装记录（含件号、序号、拆下时间、拆下原因）',
      correctAction: '请确认已填写《周转件拆装记录表》，包含拆下原因、拆下时间、装机时间等信息'
    })
  }

  if (task.needWorkCardNo && !form.workCardNo.trim()) {
    errors.push({
      field: 'workCardNo',
      type: 'missing',
      category: getErrorCategory('workCardNo', 'missing'),
      message: '借出必须关联工卡号，用于成本核算和追溯',
      correctAction: '请录入对应工卡号，格式如 WC-YYYYMMDD-XXX'
    })
  } else if (task.needWorkCardNo && form.workCardNo.trim() && !/^WC-\d{8}-\d{3}$/.test(form.workCardNo.trim())) {
    errors.push({
      field: 'workCardNo',
      type: 'format',
      category: getErrorCategory('workCardNo', 'format'),
      message: '工卡号格式不正确',
      correctAction: '工卡号格式应为 WC-YYYYMMDD-XXX，如 WC-20260615-001'
    })
  }

  return errors
}

export const validateReturnForm = (form: ReturnForm, task: Task): FieldError[] => {
  const errors: FieldError[] = []

  if (!form.partStatus) {
    errors.push({
      field: 'partStatus',
      type: 'missing',
      category: getErrorCategory('partStatus', 'missing'),
      message: '请选择拆下件状态，这是航材入库的关键信息',
      correctAction: '根据拆下件实际状态选择：可用/不可用/待修/报废'
    })
  } else if (form.partStatus !== task.correctReturnStatus) {
    const statusMap: Record<string, string> = {
      serviceable: '可用（Serviceable）',
      unserviceable: '不可用（Unserviceable）',
      awaiting_repair: '待修（Awaiting Repair）',
      scrapped: '报废（Scrapped）'
    }
    errors.push({
      field: 'partStatus',
      type: 'wrong_choice',
      category: getErrorCategory('partStatus', 'wrong_choice'),
      message: `拆下件状态判断有误，任务描述为"${task.description.slice(0, 30)}..."`,
      correctAction: `正确状态应为 ${statusMap[task.correctReturnStatus]}，请结合故障描述判断`
    })
  }

  if (task.needRepairTag && !form.hasRepairTag) {
    errors.push({
      field: 'hasRepairTag',
      type: 'wrong_choice',
      category: getErrorCategory('hasRepairTag', 'wrong_choice'),
      message: '该件需要送修，必须悬挂待修牌（红色 AOG 标签）并注明故障信息',
      correctAction: '悬挂红色待修牌，填写件号、序号、拆下日期、故障简述、送修单位'
    })
  }

  if (!task.needRepairTag && form.hasRepairTag) {
    errors.push({
      field: 'hasRepairTag',
      type: 'wrong_choice',
      category: getErrorCategory('hasRepairTag', 'wrong_choice'),
      message: '该件无需送修，不应悬挂待修牌',
      correctAction: '如为报废件直接走报废流程，标准件/低值易耗品无需挂待修牌'
    })
  }

  if (task.needCompleteAccessories && !form.accessoriesComplete) {
    errors.push({
      field: 'accessoriesComplete',
      type: 'wrong_choice',
      category: getErrorCategory('accessoriesComplete', 'wrong_choice'),
      message: '归还前未确认附件齐套，缺少封圈、螺栓等附件会影响后续使用',
      correctAction: '对照《周转件附件清单》确认 O 形圈、安装螺栓、垫片等是否齐全'
    })
  }

  return errors
}

const scoreItemToErrorCategory: Record<string, ErrorCategory> = {
  'borrow-serialNo': 'missing_serial_no',
  'borrow-airworthiness': 'missing_airworthiness_tag',
  'borrow-disassembly': 'missing_disassembly_record',
  'borrow-workCard': 'missing_work_card_no',
  'return-status': 'wrong_part_status',
  'return-repairTag': 'missing_repair_tag',
  'return-accessories': 'incomplete_accessories',
  'borrow-partNo': 'format_error'
}

const returnStatusLabelMap: Record<string, string> = {
  serviceable: '可用（Serviceable）',
  unserviceable: '不可用（Unserviceable）',
  awaiting_repair: '待修（Awaiting Repair）',
  scrapped: '报废（Scrapped）'
}

export const calculateScore = (
  task: Task,
  borrowForm: BorrowForm,
  returnForm: ReturnForm,
  borrowErrors: FieldError[],
  returnErrors: FieldError[],
  historicalErrors?: { borrow: FieldError[]; returned: FieldError[] }
): PracticeResult => {
  const scoreItems: ScoreItem[] = []
  let totalScore = 0
  let maxScore = 0

  maxScore += 15
  const partNoCorrect = borrowForm.partNo.trim() === task.partNo
  scoreItems.push({
    id: 'borrow-partNo',
    category: '借出环节',
    field: 'partNo',
    description: '录入正确的周转件件号',
    passed: partNoCorrect,
    userAnswer: borrowForm.partNo || '（未填）',
    correctAnswer: task.partNo,
    feedback: partNoCorrect ? '件号录入准确，符合要求' : '件号错误或未填写，无法定位周转件',
    score: partNoCorrect ? 15 : 0,
    maxScore: 15,
    errorCategory: scoreItemToErrorCategory['borrow-partNo']
  })
  totalScore += partNoCorrect ? 15 : 0

  maxScore += 20
  const serialNoCorrect = borrowForm.serialNo.trim() === task.serialNo
  scoreItems.push({
    id: 'borrow-serialNo',
    category: '借出环节',
    field: 'serialNo',
    description: '录入正确的周转件序号（一物一号）',
    passed: serialNoCorrect,
    userAnswer: borrowForm.serialNo || '（未填）',
    correctAnswer: task.serialNo,
    feedback: serialNoCorrect ? '序号填写正确，确保可追溯性' : '漏填或错填序号，无法锁定唯一实物',
    score: serialNoCorrect ? 20 : 0,
    maxScore: 20,
    errorCategory: scoreItemToErrorCategory['borrow-serialNo']
  })
  totalScore += serialNoCorrect ? 20 : 0

  maxScore += 15
  const airworthinessCorrect = borrowForm.hasAirworthinessTag === task.needAirworthinessTag
  scoreItems.push({
    id: 'borrow-airworthiness',
    category: '借出环节',
    field: 'hasAirworthinessTag',
    description: '正确判断是否需要适航标签',
    passed: airworthinessCorrect,
    userAnswer: borrowForm.hasAirworthinessTag ? '需要' : '不需要',
    correctAnswer: task.needAirworthinessTag ? '需要' : '不需要',
    feedback: airworthinessCorrect
      ? '适航标签判断正确，符合适航管理要求'
      : task.needAirworthinessTag
        ? '装机件必须具备有效适航标签（8130-3/Form 1）'
        : '此类周转件无需适航标签，避免过度审核',
    score: airworthinessCorrect ? 15 : 0,
    maxScore: 15,
    errorCategory: scoreItemToErrorCategory['borrow-airworthiness']
  })
  totalScore += airworthinessCorrect ? 15 : 0

  maxScore += 10
  const disassemblyCorrect = borrowForm.hasDisassemblyRecord === task.needDisassemblyRecord
  scoreItems.push({
    id: 'borrow-disassembly',
    category: '借出环节',
    field: 'hasDisassemblyRecord',
    description: '正确判断是否需要拆装记录',
    passed: disassemblyCorrect,
    userAnswer: borrowForm.hasDisassemblyRecord ? '需要' : '不需要',
    correctAnswer: task.needDisassemblyRecord ? '需要' : '不需要',
    feedback: disassemblyCorrect
      ? '拆装记录判断正确'
      : '高价值周转件必须附拆装记录以确保履历完整',
    score: disassemblyCorrect ? 10 : 0,
    maxScore: 10,
    errorCategory: scoreItemToErrorCategory['borrow-disassembly']
  })
  totalScore += disassemblyCorrect ? 10 : 0

  maxScore += 10
  const workCardCorrect = task.needWorkCardNo
    ? !!borrowForm.workCardNo.trim() && /^WC-\d{8}-\d{3}$/.test(borrowForm.workCardNo.trim())
    : true
  scoreItems.push({
    id: 'borrow-workCard',
    category: '借出环节',
    field: 'workCardNo',
    description: task.needWorkCardNo ? '关联正确格式的工卡号' : '工卡号（非必填）',
    passed: workCardCorrect,
    userAnswer: borrowForm.workCardNo || '（未填）',
    correctAnswer: task.needWorkCardNo ? 'WC-YYYYMMDD-XXX 格式' : '（可选）',
    feedback: workCardCorrect
      ? task.needWorkCardNo ? '工卡号格式正确，已关联' : '工卡号非必填，跳过'
      : '工卡号缺失或格式错误，影响成本归集与追溯',
    score: workCardCorrect ? 10 : 0,
    maxScore: 10,
    errorCategory: scoreItemToErrorCategory['borrow-workCard']
  })
  totalScore += workCardCorrect ? 10 : 0

  maxScore += 15
  const statusCorrect = returnForm.partStatus === task.correctReturnStatus
  scoreItems.push({
    id: 'return-status',
    category: '归还环节',
    field: 'partStatus',
    description: '正确判断拆下件状态',
    passed: statusCorrect,
    userAnswer: returnStatusLabelMap[returnForm.partStatus] || '（未选）',
    correctAnswer: returnStatusLabelMap[task.correctReturnStatus],
    feedback: statusCorrect
      ? '拆下件状态判断准确'
      : `状态判断错误，结合"${task.description.slice(0, 20)}..."应选择${returnStatusLabelMap[task.correctReturnStatus]}`,
    score: statusCorrect ? 15 : 0,
    maxScore: 15,
    errorCategory: scoreItemToErrorCategory['return-status']
  })
  totalScore += statusCorrect ? 15 : 0

  maxScore += 8
  const repairTagCorrect = returnForm.hasRepairTag === task.needRepairTag
  scoreItems.push({
    id: 'return-repairTag',
    category: '归还环节',
    field: 'hasRepairTag',
    description: '正确判断是否需要挂待修牌',
    passed: repairTagCorrect,
    userAnswer: returnForm.hasRepairTag ? '是' : '否',
    correctAnswer: task.needRepairTag ? '是' : '否',
    feedback: repairTagCorrect
      ? '待修牌判断正确'
      : task.needRepairTag
        ? '需送修件必须挂红色待修牌，防止误用'
        : '该件无需挂待修牌',
    score: repairTagCorrect ? 8 : 0,
    maxScore: 8,
    errorCategory: scoreItemToErrorCategory['return-repairTag']
  })
  totalScore += repairTagCorrect ? 8 : 0

  maxScore += 7
  const accessoriesCorrect = returnForm.accessoriesComplete === task.needCompleteAccessories
  scoreItems.push({
    id: 'return-accessories',
    category: '归还环节',
    field: 'accessoriesComplete',
    description: '确认附件齐套',
    passed: accessoriesCorrect,
    userAnswer: returnForm.accessoriesComplete ? '齐套' : '不齐套',
    correctAnswer: task.needCompleteAccessories ? '齐套' : '（不要求）',
    feedback: accessoriesCorrect
      ? '附件齐套确认完成'
      : '归还前请核对附件清单，缺少封圈/螺栓会影响下次装机',
    score: accessoriesCorrect ? 7 : 0,
    maxScore: 7,
    errorCategory: scoreItemToErrorCategory['return-accessories']
  })
  totalScore += accessoriesCorrect ? 7 : 0

  const passRate = Math.round((totalScore / maxScore) * 100)
  const passed = passRate >= 80

  return {
    id: 'R' + Date.now(),
    taskId: task.id,
    taskTitle: task.title,
    aircraftNo: task.aircraftNo,
    totalScore,
    maxScore,
    passRate,
    passed,
    scoreItems,
    borrowErrors,
    returnErrors,
    borrowForm: { ...borrowForm },
    returnForm: { ...returnForm },
    completedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    duration: Math.floor((Date.now() - (Date.now() - 300000)) / 1000),
    historicalErrors
  }
}

export const getDifficultyLabel = (difficulty: string): string => {
  const map: Record<string, string> = {
    easy: '入门',
    medium: '进阶',
    hard: '资深'
  }
  return map[difficulty] || difficulty
}

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待练习',
    in_progress: '进行中',
    completed: '已完成'
  }
  return map[status] || status
}

export const getTaskStats = (taskId: string, records: PracticeResult[]): TaskStats => {
  const taskRecords = records.filter(r => r.taskId === taskId)
  const practiceCount = taskRecords.length
  const passCount = taskRecords.filter(r => r.passed).length
  const sortedByDate = [...taskRecords].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )
  const recentScore = sortedByDate[0]?.passRate ?? null
  const highestScore = practiceCount > 0 ? Math.max(...taskRecords.map(r => r.passRate)) : null
  const recentCompletedAt = sortedByDate[0]?.completedAt ?? null

  const errorCategoryCounts: Partial<Record<ErrorCategory, number>> = {}
  taskRecords.forEach(record => {
    const allErrors = [...record.borrowErrors, ...record.returnErrors]
    if (record.historicalErrors) {
      allErrors.push(...record.historicalErrors.borrow, ...record.historicalErrors.returned)
    }
    allErrors.forEach(error => {
      const cat = error.category || 'other'
      errorCategoryCounts[cat] = (errorCategoryCounts[cat] || 0) + 1
    })
  })

  return {
    taskId,
    practiceCount,
    passCount,
    recentScore,
    highestScore,
    recentCompletedAt,
    errorCategoryCounts
  }
}

export const generateTrainingReport = (
  records: PracticeResult[],
  tasks: Task[],
  periodDays: number = 7
): TrainingReport => {
  const now = new Date()
  const cutoffTime = now.getTime() - periodDays * 24 * 60 * 60 * 1000

  const periodRecords = periodDays === 0
    ? records
    : records.filter(r => {
        const recordTime = new Date(r.completedAt).getTime()
        return recordTime >= cutoffTime
      })

  const totalPractices = periodRecords.length
  const totalPassed = periodRecords.filter(r => r.passed).length
  const overallPassRate =
    totalPractices > 0
      ? Math.round(periodRecords.reduce((s, r) => s + r.passRate, 0) / totalPractices)
      : 0

  const uniqueTaskIds = new Set(periodRecords.map(r => r.taskId))
  const uniqueTasksPracticed = uniqueTaskIds.size

  let totalErrors = 0
  const errorCounts: Record<string, { count: number; taskIds: Set<string> }> = {}

  periodRecords.forEach(record => {
    const allErrors = [...record.borrowErrors, ...record.returnErrors]
    if (record.historicalErrors) {
      allErrors.push(...record.historicalErrors.borrow, ...record.historicalErrors.returned)
    }
    totalErrors += allErrors.length
    allErrors.forEach(error => {
      const cat = error.category || 'other'
      if (!errorCounts[cat]) {
        errorCounts[cat] = { count: 0, taskIds: new Set() }
      }
      errorCounts[cat].count++
      errorCounts[cat].taskIds.add(record.taskId)
    })
  })

  const sortedErrors = Object.entries(errorCounts)
    .map(([category, data]) => ({
      category: category as ErrorCategory,
      count: data.count,
      label: ERROR_CATEGORY_LABELS[category as ErrorCategory] || category,
      relatedTaskIds: Array.from(data.taskIds)
    }))
    .sort((a, b) => b.count - a.count)

  const topErrors: ErrorFrequencyItem[] = sortedErrors.slice(0, 5).map(item => {
    let severity: 'critical' | 'warning' | 'info' = 'info'
    if (item.count >= 5) severity = 'critical'
    else if (item.count >= 3) severity = 'warning'

    const suggestions: Record<ErrorCategory, string> = {
      missing_serial_no: '重点练习序号录入，记住一物一号，仔细核对实物铭牌',
      missing_airworthiness_tag: '加强适航标签识别训练，装机件必须有 FAA/EASA/CAAC 标签',
      missing_disassembly_record: '高价值周转件归还时注意检查拆装记录是否齐全',
      missing_work_card_no: '工卡号格式为 WC-YYYYMMDD-XXX，录入前先确认格式',
      missing_repair_tag: '待修件必须挂红色 AOG 待修牌，防止误用',
      wrong_part_status: '结合故障描述判断件状态：可用/不可用/待修/报废',
      incomplete_accessories: '归还前对照附件清单逐一核对，特别是封圈、螺栓等小件',
      format_error: '注意录入格式规范，件号序号都有标准格式',
      other: '仔细阅读题目要求，按流程逐步操作'
    }

    return {
      ...item,
      severity,
      suggestion: suggestions[item.category] || '继续加强练习'
    }
  })

  const weakCategories = topErrors
    .filter(e => e.count >= 2)
    .map(e => e.category)

  const weakPoints: WeakPoint[] = []
  if (weakCategories.includes('missing_serial_no') || weakCategories.includes('format_error')) {
    weakPoints.push({
      title: '实物标识识别能力不足',
      description: '对件号、序号的录入和核对不熟练，容易漏填或填错，影响周转件追溯性',
      relatedCategories: ['missing_serial_no', 'format_error']
    })
  }
  if (weakCategories.includes('missing_airworthiness_tag') || weakCategories.includes('missing_disassembly_record')) {
    weakPoints.push({
      title: '适航与履历管理意识薄弱',
      description: '对适航标签、拆装记录等法定文件的重要性认识不足，容易遗漏检查',
      relatedCategories: ['missing_airworthiness_tag', 'missing_disassembly_record', 'missing_work_card_no']
    })
  }
  if (weakCategories.includes('missing_repair_tag') || weakCategories.includes('wrong_part_status')) {
    weakPoints.push({
      title: '状态判定与标识管理需加强',
      description: '拆下件状态判断不准，待修牌使用不规范，可能导致错装误用',
      relatedCategories: ['missing_repair_tag', 'wrong_part_status']
    })
  }
  if (weakCategories.includes('incomplete_accessories')) {
    weakPoints.push({
      title: '附件齐套检查不细致',
      description: '归还时附件核对不仔细，缺少小件会影响下次装机使用',
      relatedCategories: ['incomplete_accessories']
    })
  }
  if (weakPoints.length === 0 && topErrors.length > 0) {
    weakPoints.push({
      title: '操作规范性有待提升',
      description: '偶有小错误出现，建议按标准流程逐步操作，不要跳步',
      relatedCategories: weakCategories.length > 0 ? weakCategories : ['other']
    })
  }

  const taskStatsMap: Record<string, { count: number; totalScore: number; errorCount: number }> = {}
  periodRecords.forEach(record => {
    if (!taskStatsMap[record.taskId]) {
      taskStatsMap[record.taskId] = { count: 0, totalScore: 0, errorCount: 0 }
    }
    taskStatsMap[record.taskId].count++
    taskStatsMap[record.taskId].totalScore += record.passRate
    let recErrors = record.borrowErrors.length + record.returnErrors.length
    if (record.historicalErrors) {
      recErrors += record.historicalErrors.borrow.length + record.historicalErrors.returned.length
    }
    taskStatsMap[record.taskId].errorCount += recErrors
  })

  const recommendedTasks: TaskRecommendation[] = tasks
    .map(task => {
      const stats = taskStatsMap[task.id] || { count: 0, totalScore: 0, errorCount: 0 }
      const passRate = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0

      let reason = ''
      if (stats.count > 0 && passRate < 70) {
        reason = `通过率 ${passRate}%，${stats.errorCount} 个错误待纠正`
      } else if (stats.count > 0 && passRate < 85) {
        reason = `通过率 ${passRate}%，仍有提升空间`
      } else if (stats.errorCount >= 4) {
        reason = `累计 ${stats.errorCount} 个错误，建议强化`
      } else if (stats.count === 0 && task.difficulty !== 'easy') {
        reason = '尚未练习，建议尽快完成'
      }

      return {
        taskId: task.id,
        taskTitle: task.title,
        reason,
        practiceCount: stats.count,
        passRate
      }
    })
    .filter(t => t.reason)
    .sort((a, b) => {
      if (a.passRate !== b.passRate) return a.passRate - b.passRate
      return b.practiceCount - a.practiceCount
    })
    .slice(0, 4)

  return {
    totalPractices,
    totalPassed,
    overallPassRate,
    uniqueTasksPracticed,
    totalErrors,
    periodDays,
    topErrors,
    weakPoints,
    weakCategories,
    recommendedTasks,
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }
}

export const getResultErrorCategories = (result: PracticeResult): ErrorCategory[] => {
  const categories = new Set<ErrorCategory>()
  result.borrowErrors.forEach(e => categories.add(e.category))
  result.returnErrors.forEach(e => categories.add(e.category))
  if (result.historicalErrors) {
    result.historicalErrors.borrow.forEach(e => categories.add(e.category))
    result.historicalErrors.returned.forEach(e => categories.add(e.category))
  }
  return Array.from(categories)
}

const inferErrorCategory = (error: Partial<FieldError>): ErrorCategory => {
  if (error.category && error.category !== 'other') {
    return error.category as ErrorCategory
  }
  const field = error.field || ''
  const message = error.message || ''
  const type = error.type || ''

  if (field === 'serialNo' || message.includes('序号') || message.includes('S/N')) {
    return 'missing_serial_no'
  }
  if (field === 'hasAirworthinessTag' || message.includes('适航') || message.includes('8130') || message.includes('EASA')) {
    return 'missing_airworthiness_tag'
  }
  if (field === 'hasDisassemblyRecord' || message.includes('拆装') || message.includes('拆装记录')) {
    return 'missing_disassembly_record'
  }
  if (field === 'workCardNo' || message.includes('工卡') || message.includes('WC-')) {
    return 'missing_work_card_no'
  }
  if (field === 'hasRepairTag' || message.includes('待修') || message.includes('AOG') || message.includes('修理')) {
    return 'missing_repair_tag'
  }
  if (field === 'partStatus' || message.includes('状态') || message.includes('serviceable') || message.includes('unserviceable')) {
    return 'wrong_part_status'
  }
  if (field === 'accessoriesComplete' || message.includes('附件') || message.includes('齐套') || message.includes('封圈')) {
    return 'incomplete_accessories'
  }
  if (field === 'partNo' || type === 'format' || message.includes('格式') || message.includes('件号')) {
    return 'format_error'
  }
  return 'other'
}

export const migrateRecordCategories = (record: PracticeResult): PracticeResult => {
  let hasChanges = false

  const migratedBorrowErrors = record.borrowErrors.map(err => {
    if (!err.category || err.category === 'other') {
      hasChanges = true
      return { ...err, category: inferErrorCategory(err) }
    }
    return err
  })

  const migratedReturnErrors = record.returnErrors.map(err => {
    if (!err.category || err.category === 'other') {
      hasChanges = true
      return { ...err, category: inferErrorCategory(err) }
    }
    return err
  })

  let migratedHistoricalErrors = record.historicalErrors
  if (record.historicalErrors) {
    const migratedHistBorrow = record.historicalErrors.borrow.map(err => {
      if (!err.category || err.category === 'other') {
        hasChanges = true
        return { ...err, category: inferErrorCategory(err) }
      }
      return err
    })
    const migratedHistReturn = record.historicalErrors.returned.map(err => {
      if (!err.category || err.category === 'other') {
        hasChanges = true
        return { ...err, category: inferErrorCategory(err) }
      }
      return err
    })
    migratedHistoricalErrors = {
      borrow: migratedHistBorrow,
      returned: migratedHistReturn
    }
  }

  const migratedScoreItems = record.scoreItems.map(item => {
    if (!item.errorCategory || item.errorCategory === 'other') {
      hasChanges = true
      const categoryFromField = scoreItemToErrorCategory[item.id as keyof typeof scoreItemToErrorCategory]
      return { ...item, errorCategory: categoryFromField || inferErrorCategory({ field: item.field }) }
    }
    return item
  })

  if (!hasChanges) return record

  return {
    ...record,
    borrowErrors: migratedBorrowErrors,
    returnErrors: migratedReturnErrors,
    scoreItems: migratedScoreItems,
    historicalErrors: migratedHistoricalErrors
  }
}

export const migrateAllRecords = (records: PracticeResult[]): PracticeResult[] => {
  return records.map(rec => migrateRecordCategories(rec))
}

export const getAllResultErrors = (result: PracticeResult): FieldError[] => {
  const all = [...result.borrowErrors, ...result.returnErrors]
  if (result.historicalErrors) {
    all.push(...result.historicalErrors.borrow, ...result.historicalErrors.returned)
  }
  return all
}

export const isHistoricalErrorCorrected = (
  historicalError: FieldError,
  finalBorrowErrors: FieldError[],
  finalReturnErrors: FieldError[]
): boolean => {
  const allFinalErrors = [...finalBorrowErrors, ...finalReturnErrors]
  return !allFinalErrors.some(
    e => e.field === historicalError.field && e.category === historicalError.category
  )
}

export const safeGenerateTrainingReport = (
  records: PracticeResult[],
  tasks: Task[],
  periodDays: number = 7
): TrainingReport => {
  try {
    return generateTrainingReport(records, tasks, periodDays)
  } catch (err) {
    console.error('[safeGenerateTrainingReport] 生成报告失败:', err)
    return {
      totalPractices: records.length,
      totalPassed: records.filter(r => r.passed).length,
      overallPassRate: records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.passRate, 0) / records.length)
        : 0,
      uniqueTasksPracticed: new Set(records.map(r => r.taskId)).size,
      totalErrors: 0,
      periodDays,
      topErrors: [],
      weakPoints: [],
      weakCategories: [],
      recommendedTasks: [],
      generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    }
  }
}
