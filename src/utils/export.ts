import ExcelJS from 'exceljs'
import { OrderStatistics } from '../types'

const STATE_MAP: { [key: number]: string } = {
  1: '待支付',
  2: '已支付',
  3: '已完成',
  4: '已取消',
  5: '已退款',
  6: '处理中'
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

export async function exportToExcel(data: OrderStatistics[], filename: string = 'statistics.xlsx') {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('流水统计')

  worksheet.columns = [
    { header: '商品名称', key: 'goodName', width: 40 },
    { header: '订单数量', key: 'orderCount', width: 12 },
    { header: '订单状态', key: 'orderStates', width: 30 },
    { header: '拿货价', key: 'avgUnitPrice', width: 15 },
    { header: '总退款数', key: 'totalRefundCount', width: 12 },
    { header: '退款金额', key: 'totalRefundAmount', width: 15 },
    { header: '总拿货价', key: 'totalSales', width: 15 },
    { header: '总成本', key: 'totalCost', width: 15 },
    { header: '总收益', key: 'totalProfit', width: 15 },
    { header: '平台服务费', key: 'totalPlatformFee', width: 15 },
    { header: '平均收益', key: 'avgProfit', width: 15 },
    { header: '收益率(%)', key: 'profitMargin', width: 12 }
  ]

  data.forEach(row => {
    worksheet.addRow({
      goodName: row.goodName,
      orderCount: row.orderCount,
      orderStates: formatOrderStates(row.orderStates),
      avgUnitPrice: row.avgUnitPrice.toFixed(2),
      totalRefundCount: row.totalRefundCount,
      totalRefundAmount: row.totalRefundAmount.toFixed(2),
      totalSales: row.totalSales.toFixed(2),
      totalCost: row.totalCost.toFixed(2),
      totalProfit: row.totalProfit.toFixed(2),
      totalPlatformFee: row.totalPlatformFee.toFixed(2),
      avgProfit: row.avgProfit.toFixed(2),
      profitMargin: row.profitMargin.toFixed(2)
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
