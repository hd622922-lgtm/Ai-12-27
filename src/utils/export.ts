import ExcelJS from 'exceljs'
import { OrderStatistics } from '../types'

const STATE_MAP: { [key: number]: string } = {
  1: '待支付',
  2: '已支付',
  3: '已完成',
  4: '已取消',
  5: '已退款',
  6: '处理中',
  9: '退款中'
}

function formatOrderStates(orderStates: { [key: number]: number }): string {
  const stateEntries = Object.entries(orderStates)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([state, count]) => {
      const stateText = STATE_MAP[Number(state)] || `状态${state}`
      return `${stateText}:${count}`
    })
    .join(', ')
  return stateEntries
}

interface SummaryData {
  orderCount: number;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalPlatformFee: number;
  totalRefundCount: number;
  totalRefundAmount: number;
}

export async function exportToExcel(data: OrderStatistics[], summaryData: SummaryData, filename: string = 'statistics.xlsx') {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('流水统计')

  // Add the table headers
  worksheet.columns = [
    { header: '序号', key: 'index', width: 10 },
    { header: '商品名称', key: 'goodName', width: 40 },
    { header: '单数', key: 'orderCount', width: 12 },
    { header: '货源价', key: 'avgUnitPrice', width: 15 },
    { header: '期望利润', key: 'expectedProfit', width: 15 },
    { header: '平台服务费', key: 'totalPlatformFee', width: 15 },
    { header: '退款数', key: 'totalRefundCount', width: 12 },
    { header: '总退款', key: 'totalRefundAmount', width: 15 },
    { header: '总货源价', key: 'totalSales', width: 15 },
    { header: '总成本', key: 'totalCost', width: 15 },
    { header: '订单状态', key: 'orderStates', width: 30 },
    { header: '总收益', key: 'totalProfit', width: 15 },
    { header: '收益率(%)', key: 'profitMargin', width: 15 }
  ]

  // Add data rows with index
  data.forEach((row, index) => {
    worksheet.addRow({
      index: index + 1,
      goodName: row.goodName,
      orderCount: row.orderCount,
      avgUnitPrice: row.avgUnitPrice.toFixed(2),
      expectedProfit: (row.expectedProfit ?? 0.2).toFixed(2),
      totalPlatformFee: (row.totalPlatformFee).toFixed(2), // Using the calculated value from the table
      totalRefundCount: row.totalRefundCount,
      totalRefundAmount: row.totalRefundAmount.toFixed(2),
      totalSales: row.totalSales.toFixed(2),
      totalCost: row.totalCost.toFixed(2),
      orderStates: formatOrderStates(row.orderStates),
      totalProfit: row.totalProfit.toFixed(2),
      profitMargin: row.profitMargin.toFixed(2)
    })
  })

  // Add 3 empty rows before summary
  worksheet.addRow([])
  worksheet.addRow([])
  worksheet.addRow([])

  // Add summary information at the bottom
  worksheet.addRow(['总订单数:', summaryData.orderCount])
  worksheet.addRow(['总货源价:', `¥${summaryData.totalSales.toFixed(2)}`])
  worksheet.addRow(['总成本:', `¥${summaryData.totalCost.toFixed(2)}`])
  worksheet.addRow(['平台服务费:', `¥${summaryData.totalPlatformFee.toFixed(2)}`])
  worksheet.addRow(['总退款数:', summaryData.totalRefundCount])
  worksheet.addRow(['总退款金额:', `¥${summaryData.totalRefundAmount.toFixed(2)}`])
  worksheet.addRow(['总收益:', `¥${summaryData.totalProfit.toFixed(2)}`])

  // Style the summary section at the bottom
  const totalRows = worksheet.rowCount;
  for (let i = totalRows - 6; i <= totalRows; i++) {
    worksheet.getRow(i).font = { bold: true }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
