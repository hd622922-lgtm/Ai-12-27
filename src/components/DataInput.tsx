import { Alert, Button, Card, Input, Space } from 'antd'
import { useState } from 'react'
import { Order } from '../types'
import { parseJsonData, validateOrder } from '../utils/dataParser'

const { TextArea } = Input

interface DataInputProps {
  onDataLoaded: (orders: Order[]) => void
}

export default function DataInput({ onDataLoaded }: DataInputProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState('')

  const handleParse = () => {
    setError('')

    if (!jsonInput.trim()) {
      setError('请输入JSON数据')
      return
    }

    const data = parseJsonData(jsonInput)

    if (!data) {
      setError('JSON格式错误，请检查数据格式')
      return
    }

    if (data.orderList.length === 0) {
      setError('订单列表为空')
      return
    }

    const validOrders = data.orderList.filter(validateOrder)

    if (validOrders.length === 0) {
      setError('没有有效的订单数据')
      return
    }

    if (validOrders.length < data.orderList.length) {
      setError(`警告：${data.orderList.length - validOrders.length}条订单数据不完整，已过滤`)
    }

    onDataLoaded(validOrders)
  }

  const handleClear = () => {
    setJsonInput('')
    setError('')
  }

  return (
    <Card title="数据输入" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <TextArea
          rows={10}
          placeholder="请粘贴第三方接口返回的JSON数据，格式如下：
{
  &quot;orderList&quot;: [
    {
      &quot;OrderId&quot;: 1951327,
      &quot;GoodMessage&quot;: &quot;商品名称&quot;,
      &quot;AllMoney&quot;: 13.15,
      &quot;GoodFaceValue&quot;: 11.95,
      ...
    }
  ]
}"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        {error && <Alert message={error} type={error.includes('警告') ? 'warning' : 'error'} />}
        <Space>
          <Button type="primary" onClick={handleParse}>
            解析数据
          </Button>
          <Button onClick={handleClear}>
            清空
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
