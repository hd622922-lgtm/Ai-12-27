import _ from 'lodash';
import { Order, OrderStatistics } from '../types';
import { normalizeGoodName } from './dataParser';
import { calculatePlatformFee, calculateProfitMargin } from './statistics';

/**
 * Extracts keywords from a product name to help with similarity grouping
 * @param name - The product name
 * @returns Array of keywords extracted from the name
 */
function extractKeywords(name: string): string[] {
  // Remove the price part if present (e.g., from "商品A (¥10)")
  const cleanName = name.replace(/\(¥[\d.]+\)/, '').trim();
  // Split by common separators and filter out empty strings
  return cleanName.split(/[\s\-_]+/).filter(keyword => keyword.length > 0);
}

/**
 * Calculates similarity between two product names based on common keywords
 * @param name1 - First product name
 * @param name2 - Second product name
 * @returns Similarity score (0 to 1)
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const keywords1 = extractKeywords(name1);
  const keywords2 = extractKeywords(name2);
  
  if (keywords1.length === 0 || keywords2.length === 0) {
    return name1 === name2 ? 1 : 0;
  }
  
  // Count common keywords
  const commonKeywords = keywords1.filter(keyword => keywords2.includes(keyword));
  const totalUniqueKeywords = new Set([...keywords1, ...keywords2]).size;
  
  return commonKeywords.length / totalUniqueKeywords;
}

/**
 * Groups orders by normalized good name and unit price
 * @param orders - Array of orders to group
 * @returns Map where keys are normalized good names with unit prices and values are arrays of orders
 */
export function groupOrdersByGoodName(orders: Order[]): Map<string, Order[]> {
  const grouped = new Map<string, Order[]>()
  
  orders.forEach(order => {
    const normalizedName = normalizeGoodName(order.GoodMessage)
    const groupKey = `${normalizedName}|${order.UnitMoney}`
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, [])
    }
    grouped.get(groupKey)!.push(order)
  })
  
  return grouped
}

/**
 * Calculates statistics for orders grouped by good name and unit price
 * @param orders - Array of orders to calculate statistics for
 * @returns Array of order statistics sorted by name similarity groups and total profit in descending order
 */
export function calculateStatistics(orders: Order[]): OrderStatistics[] {
  const grouped = groupOrdersByGoodName(orders)
  const results: OrderStatistics[] = []
  
  grouped.forEach((groupOrders, groupKey) => {
    const [goodName, unitPrice] = groupKey.split('|')
    const displayGoodName = `${goodName} (¥${unitPrice})`
    const orderCount = groupOrders.length
    const avgUnitPrice = _.sumBy(groupOrders, 'UnitMoney') / orderCount
    const totalSales = avgUnitPrice * orderCount  // totalSales = avgUnitPrice * orderCount
    const totalCost = _.sumBy(groupOrders, 'GoodFaceValue')
    
    // Filter completed orders (State === 3) for platform fee calculation
    const completedOrders = groupOrders.filter(order => order.State === 3)
    
    const totalPlatformFee = _.sumBy(completedOrders, order => calculatePlatformFee(order.AllMoney))
    // const totalPlatformFee = 987877
    console.log("不知道是什么",completedOrders);
    
    
    const totalProfit = totalSales + totalPlatformFee - totalCost
    
    // Track order states and refund information
    const orderStates: { [key: number]: number } = {}
    let totalRefundCount = 0
    let totalRefundAmount = 0
    
    groupOrders.forEach(order => {
      if (!orderStates[order.State]) {
        orderStates[order.State] = 0
      }
      orderStates[order.State]++
      
      // State === 5 indicates refunded orders
      if (order.State === 5) {
        totalRefundCount++
        totalRefundAmount += order.UnitMoney
      }
    })
    
    const avgProfit = totalProfit / orderCount
    const profitMargin = calculateProfitMargin(totalProfit, totalSales)
    
    results.push({
      goodName: displayGoodName,
      orderCount,
      orderStates,
      totalRefundCount,
      totalRefundAmount,
      totalSales,
      totalCost,
      totalProfit,
      totalPlatformFee,
      avgProfit,
      profitMargin,
      avgUnitPrice
    })
  })
  
  // Group items by name similarity and then sort by total profit within each group
  const groupedResults: OrderStatistics[][] = [];
  const processed: boolean[] = new Array(results.length).fill(false);
  
  for (let i = 0; i < results.length; i++) {
    if (processed[i]) continue;
    
    const currentGroup: OrderStatistics[] = [results[i]];
    processed[i] = true;
    
    // Find similar items for the current group
    for (let j = i + 1; j < results.length; j++) {
      if (processed[j]) continue;
      
      const similarity = calculateNameSimilarity(results[i].goodName, results[j].goodName);
      // If similarity is above threshold, add to the same group
      if (similarity > 0.3) { // 30% similarity threshold
        currentGroup.push(results[j]);
        processed[j] = true;
      }
    }
    
    // Sort by total profit within the group (descending)
    currentGroup.sort((a, b) => b.totalProfit - a.totalProfit);
    groupedResults.push(currentGroup);
  }
  
  // Flatten the grouped results
  const flattenedResults: OrderStatistics[] = [];
  // Sort groups by the profit of the first item in each group
  groupedResults.sort((a, b) => b[0].totalProfit - a[0].totalProfit);
  
  groupedResults.forEach(group => {
    flattenedResults.push(...group);
  });
  
  return flattenedResults;
}
