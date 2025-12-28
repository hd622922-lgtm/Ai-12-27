import { Empty, Layout, Typography } from 'antd'
import { useState } from 'react'
import DataInput from './components/DataInput'
import StatisticsTable from './components/StatisticsTable'
import { Order, OrderStatistics } from './types'
import { calculateStatistics } from './utils/dataProcessor'

const { Header, Content } = Layout
const { Title } = Typography

function App() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statistics, setStatistics] = useState<OrderStatistics[]>([])

  const handleDataLoaded = (loadedOrders: Order[]) => {
    setOrders(loadedOrders)
    const stats = calculateStatistics(loadedOrders)
    setStatistics(stats)
  }

  const handleExpectedProfitChange = (goodName: string, newExpectedProfit: number) => {
    setStatistics(prevStats =>
      prevStats.map(stat =>
        stat.goodName === goodName
          ? { ...stat, expectedProfit: newExpectedProfit }
          : stat
      )
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#fff', margin: '16px 0' }}>
          伟大的杨总明老板---高级专属流水统计系统
        </Title>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <DataInput onDataLoaded={handleDataLoaded} />

          {statistics.length > 0 ? (
            <StatisticsTable data={statistics} onExpectedProfitChange={handleExpectedProfitChange} />
          ) : orders.length > 0 ? (
            <Empty description="暂无统计数据" />
          ) : null}
        </div>
      </Content>
    </Layout>
  )
}

export default App
