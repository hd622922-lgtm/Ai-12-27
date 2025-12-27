/**
 * Calculates platform fee based on sales price
 * Rule: 
 * - Sales price <= 10,000: fee = sales price * 0.06%
 * - Sales price > 10,000: fee = 10,000 * 0.06% + (sales price - 10,000) * 1%
 * @param salesPrice - The sales price to calculate fee for
 * @returns Platform fee amount
 */
export function calculatePlatformFee(salesPrice: number): number {
  const threshold = 10000
  
  if (salesPrice <= threshold) {
    return salesPrice * 0.0006
  } else {
    return threshold * 0.0006 + (salesPrice - threshold) * 0.01
  }
}

/**
 * Calculates profit based on sales price and cost price
 * @param salesPrice - The sales price
 * @param costPrice - The cost price
 * @returns Profit amount (sales price + platform fee - cost price)
 */
export function calculateProfit(salesPrice: number, costPrice: number): number {
  const platformFee = calculatePlatformFee(salesPrice)
  return salesPrice + platformFee - costPrice
}

/**
 * Calculates profit margin as a percentage
 * @param profit - The profit amount
 * @param salesPrice - The sales price
 * @returns Profit margin percentage
 */
export function calculateProfitMargin(profit: number, salesPrice: number): number {
  if (salesPrice === 0) return 0
  return (profit / salesPrice) * 100
}
