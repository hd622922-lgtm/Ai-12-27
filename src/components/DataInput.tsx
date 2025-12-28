import { Alert, Button, Card, Col, Input, Row, Space } from 'antd'
import { useState } from 'react'
import { Order } from '../types'
import { parseJsonData, validateOrder } from '../utils/dataParser'

const { TextArea } = Input

interface DataInputProps {
  onDataLoaded: (orders: Order[]) => void
}

export default function DataInput({ onDataLoaded }: DataInputProps) {
  const [jsonInputs, setJsonInputs] = useState<string[]>([''])
  const [error, setError] = useState('')

  const handleParse = () => {
    setError('')

    // 过滤掉空的输入
    const nonEmptyInputs = jsonInputs.filter(input => input.trim())

    if (nonEmptyInputs.length === 0) {
      setError('请至少输入一个JSON数据')
      return
    }

    let allOrders: Order[] = []
    let totalInvalidCount = 0

    for (let i = 0; i < nonEmptyInputs.length; i++) {
      const inputData = nonEmptyInputs[i]
      const data = parseJsonData(inputData)

      if (!data) {
        setError(`第${i + 1}个JSON格式错误，请检查数据格式`)
        return
      }

      if (data.orderList.length === 0) {
        setError(`第${i + 1}个数据的订单列表为空`)
        return
      }

      const validOrders = data.orderList.filter(validateOrder)
      const invalidCount = data.orderList.length - validOrders.length

      if (validOrders.length === 0) {
        setError(`第${i + 1}个数据没有有效的订单数据`)
        return
      }

      totalInvalidCount += invalidCount
      allOrders = allOrders.concat(validOrders)
    }

    if (totalInvalidCount > 0) {
      setError(`警告：总共${totalInvalidCount}条订单数据不完整，已过滤`)
    }

    onDataLoaded(allOrders)
  }

  const handleClear = () => {
    setJsonInputs([''])
    setError('')
  }

  const addJsonInput = () => {
    setJsonInputs([...jsonInputs, ''])
  }

  const removeJsonInput = (index: number) => {
    if (jsonInputs.length <= 1) {
      setJsonInputs([''])
      return
    }

    const newInputs = [...jsonInputs]
    newInputs.splice(index, 1)
    setJsonInputs(newInputs)
  }

  const updateJsonInput = (index: number, value: string) => {
    const newInputs = [...jsonInputs]
    newInputs[index] = value
    setJsonInputs(newInputs)
  }

  return (
    <Card title="" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={addJsonInput} type="dashed" size="small">
              添加数据源
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {jsonInputs.map((input, index) => (
            <Col span={12} key={index}>
              <Card
                size="small"
                title={`数据源 ${index + 1}`}
                style={{ marginBottom: 0 }}
                extra={
                  jsonInputs.length > 1 && (
                    <Button
                      type="link"
                      size="small"
                      danger
                      onClick={() => removeJsonInput(index)}
                    >
                      删除
                    </Button>
                  )
                }
              >
                <TextArea
                  rows={6}
                  placeholder={`请粘贴第${index + 1}个第三方接口返回的JSON数据，格式如下：
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
}`}
                  value={input}
                  onChange={(e) => updateJsonInput(index, e.target.value)}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {error && <Alert message={error} type={error.includes('警告') ? 'warning' : 'error'} />}
        <Space>
          <Button type="primary" onClick={handleParse}>
            解析并合并数据
          </Button>
          <Button onClick={handleClear}>
            清空所有
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
