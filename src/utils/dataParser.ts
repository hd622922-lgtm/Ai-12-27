import { Order, ApiResponse } from '../types'

export function parseJsonData(jsonString: string): ApiResponse | null {
  try {
    const data = JSON.parse(jsonString)
    if (data.orderList && Array.isArray(data.orderList)) {
      return data
    }
    return null
  } catch (error) {
    console.error('JSON解析错误:', error)
    return null
  }
}

export function validateOrder(order: Order): boolean {
  return !!(order.GoodMessage && order.AllMoney !== undefined && order.GoodFaceValue !== undefined)
}

export function normalizeGoodName(name: string): string {
  return name.trim().replace(/\s+/g, '')
}
