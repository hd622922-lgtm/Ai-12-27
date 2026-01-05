import { Button, Card, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { OrderStatistics } from '../types'
import { exportToExcel } from '../utils/export'
import { calculatePlatformFee } from '../utils/statistics'

interface StatisticsTableProps {
  data: OrderStatistics[]
  onExpectedProfitChange?: (goodName: string, newExpectedProfit: number) => void
}

const STATE_MAP: { [key: number]: { text: string; color: string } } = {
  1: { text: '待支付', color: 'default' },
  2: { text: '已支付', color: 'processing' },
  3: { text: '已完成', color: 'success' },
  4: { text: '已取消', color: 'default' },
  5: { text: '已退款', color: 'warning' },
  6: { text: '处理中', color: 'processing' },
  9: { text: '退款中', color: 'processing' },

}

function getStateDisplay(orderStates: { [key: number]: number }): React.ReactNode {
  const stateEntries = Object.entries(orderStates).sort((a, b) => Number(b[1]) - Number(a[1]))

  return (
    <Space size={4} wrap>
      {stateEntries.map(([state, count]) => {
        const stateInfo = STATE_MAP[Number(state)] || { text: `状态${state}`, color: 'default' }
        return (
          <Tag key={state} color={stateInfo.color}>
            {stateInfo.text}: {count}
          </Tag>
        )
      })}
    </Space>
  )
}

export default function StatisticsTable({ data, onExpectedProfitChange }: StatisticsTableProps) {
  const columns: ColumnsType<OrderStatistics> = [
    {
      title: '序号',
      key: 'index',
      width: 40,
      fixed: 'left',
      render: (_, __, index) => index + 1
    },
    {
      title: '商品名称',
      dataIndex: 'goodName',
      key: 'goodName',
      width: 180,
      fixed: 'left'
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 50,
      sorter: (a, b) => a.orderCount - b.orderCount
    },
    {
      title: '货源价',
      dataIndex: 'avgUnitPrice',
      key: 'avgUnitPrice',
      width: 60,
      render: (value: number) => `¥${value.toFixed(4)}`,
      sorter: (a, b) => a.avgUnitPrice - b.avgUnitPrice
    },
    {
      title: '期望利润',
      dataIndex: 'expectedProfit',
      key: 'expectedProfit',
      width: 60,
      render: (value: number, record: OrderStatistics) => {
        // 如果没有设置期望利润，则默认为0
        const profitValue = value !== undefined ? value : 0.3;
        return (
          <input
            type="number"
            value={profitValue}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              // 调用父组件提供的回调函数来更新数据
              console.log("期望利润修改:", record.goodName, "新值:", newValue);
              onExpectedProfitChange?.(record.goodName, newValue);
            }}
            style={{ width: '100%', padding: '2px 4px' }}
            step="0.01"
          />
        );
      },
      sorter: (a, b) => (a.expectedProfit ?? 0.3) - (b.expectedProfit ?? 0.3)
    },
    {
      title: '平台服务费',
      dataIndex: 'totalPlatformFee',
      key: 'totalPlatformFee',
      width: 50,
      render: (_: number, record: OrderStatistics) => {
        // 根据 avgUnitPrice + expectedProfit 重新计算平台服务费
        const expectedTotal = record.avgUnitPrice + (record.expectedProfit ?? 0.3);
        const recalculatedPlatformFee = calculatePlatformFee(expectedTotal);
        return `¥${recalculatedPlatformFee.toFixed(4)}`;
      },
      sorter: (a, b) => {
        const feeA = calculatePlatformFee(a.avgUnitPrice + (a.expectedProfit ?? 0.3));
        const feeB = calculatePlatformFee(b.avgUnitPrice + (b.expectedProfit ?? 0.3));
        return feeA - feeB;
      }
    },
    {
      title: '退款数',
      dataIndex: 'totalRefundCount',
      key: 'totalRefundCount',
      width: 60,
      render: (value: number) => value > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value}</span> : value,
      sorter: (a, b) => a.totalRefundCount - b.totalRefundCount
    },
    {
      title: '总退款',
      dataIndex: 'totalRefundAmount',
      key: 'totalRefundAmount',
      width: 80,
      render: (value: number) => value > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{value.toFixed(4)}</span> : `¥${value.toFixed(4)}`,
      sorter: (a, b) => a.totalRefundAmount - b.totalRefundAmount
    },
    {
      title: '总货源价',
      dataIndex: 'totalSales',
      key: 'totalSales',
      width: 80,
      render: (value: number) => `¥${value.toFixed(4)}`,
      sorter: (a, b) => a.totalSales - b.totalSales
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 80,
      render: (_: number, record: OrderStatistics) => {
        // 总成本 = 总货源价 + 平台服务费
        // 重新计算平台服务费
        const expectedTotal = (record.avgUnitPrice + (record.expectedProfit ?? 0.3)) * record.orderCount;
        const recalculatedPlatformFee = calculatePlatformFee(expectedTotal);
        const newTotalCost = record.totalSales + recalculatedPlatformFee;
        return `¥${newTotalCost.toFixed(4)}`;
      },
      sorter: (a, b) => {
        const costA = a.totalSales + calculatePlatformFee((a.avgUnitPrice + (a.expectedProfit ?? 0.3)) * a.orderCount);
        const costB = b.totalSales + calculatePlatformFee((b.avgUnitPrice + (b.expectedProfit ?? 0.3)) * b.orderCount);
        return costA - costB;
      }
    },
    {
      title: '总收益',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      width: 80,
      render: (_: number, record: OrderStatistics) => {
        // 总收益 = 已完成订单数 * 期望利润
        const completedOrderCount = record.orderStates[3] || 0; // 状态3为已完成
        const expectedTotalProfit = completedOrderCount * (record.expectedProfit ?? 0.3);
        return `¥${expectedTotalProfit.toFixed(4)}`;
      },
      sorter: (a, b) => {
        const completedOrderCountA = a.orderStates[3] || 0;
        const completedOrderCountB = b.orderStates[3] || 0;
        const profitA = completedOrderCountA * (a.expectedProfit ?? 0.3);
        const profitB = completedOrderCountB * (b.expectedProfit ?? 0.3);
        return profitA - profitB;
      }
    },


    {
      title: '订单状态',
      dataIndex: 'orderStates',
      key: 'orderStates',
      width: 60,
      fixed: 'right',
      render: (orderStates: { [key: number]: number }) => getStateDisplay(orderStates)
    }
  ]

  const handleExport = async () => {
    const date = new Date().toISOString().split('T')[0]
    await exportToExcel(data, totalSummary, `流水统计_${date}.xlsx`)
  }

  const totalSummary = data.reduce((acc, item) => {
    // 根据 avgUnitPrice + expectedProfit 重新计算平台服务费
    // 服务费 = 销售价
    const expectedTotal = (item.avgUnitPrice + (item.expectedProfit ?? 0.3)) * item.orderCount;
    const recalculatedPlatformFee = calculatePlatformFee(expectedTotal);
    // 计算新的总收益 = 已完成订单数 * 期望利润
    const completedOrderCount = item.orderStates[3] || 0; // 状态3为已完成
    const newTotalProfit = completedOrderCount * (item.expectedProfit ?? 0.3);
    // 计算新的总成本 = 总货源价 + 平台服务费
    const newTotalCost = item.totalSales + recalculatedPlatformFee;
    // console.log("商品:", item.goodName, "旧平台服务费:", acc.totalPlatformFee, "期望总金额:", expectedTotal, "重新计算平台服务费:", recalculatedPlatformFee);
    console.log(item.avgUnitPrice, "商品:", item.goodName, '期望的利润', item.expectedProfit, "期望总金额:", expectedTotal, '顶单数:', item.orderCount)
    return {
      orderCount: acc.orderCount + item.orderCount,
      totalSales: acc.totalSales + item.totalSales,
      totalCost: acc.totalCost + newTotalCost,
      totalProfit: acc.totalProfit + newTotalProfit,
      totalPlatformFee: acc.totalPlatformFee + recalculatedPlatformFee,
      totalRefundCount: acc.totalRefundCount + item.totalRefundCount,
      totalRefundAmount: acc.totalRefundAmount + item.totalRefundAmount
    }
  }, {
    orderCount: 0,
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    totalPlatformFee: 0,
    totalRefundCount: 0,
    totalRefundAmount: 0
  })

  return (
    <Card title="统计结果" extra={
      <Button type="primary" onClick={handleExport}>
        导出Excel
      </Button>
    }>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <strong>总订单数：</strong>
            <span style={{ fontSize: 16, color: '#1890ff' }}>{totalSummary.orderCount}</span>
          </div>
          <div>
            <strong>总货源价：</strong>
            <span style={{ fontSize: 16, color: '#52c41a' }}>¥{totalSummary.totalSales.toFixed(4)}</span>
          </div>
          <div>
            <strong>总成本：</strong>
            <span style={{ fontSize: 16, color: '#faad14' }}>¥{totalSummary.totalCost.toFixed(4)}</span>
          </div>
          <div>
            <strong>平台服务费：</strong>
            <span style={{ fontSize: 16, color: '#ff4d4f' }}>¥{totalSummary.totalPlatformFee.toFixed(4)}</span>
          </div>

          <div>
            <strong>总退款数：</strong>
            <span style={{ fontSize: 16, color: '#ff4d4f' }}>{totalSummary.totalRefundCount}</span>
          </div>
          <div>
            <strong>总退款金额：</strong>
            <span style={{ fontSize: 16, color: '#ff4d4f', fontWeight: 'bold' }}>¥{totalSummary.totalRefundAmount.toFixed(4)}</span>
          </div>
          <div>
            <strong>总收益：</strong>
            <span style={{ fontSize: 16, color: '#722ed1', fontWeight: 'bold' }}>¥{totalSummary.totalProfit.toFixed(4)}</span>
          </div>
        </div>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => record.goodName}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1810 }}
        size="middle"
        rowClassName={(_, index) => index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
      />
    </Card>
  )
}
