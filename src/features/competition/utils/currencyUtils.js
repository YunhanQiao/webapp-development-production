export const SUPPORTED_CURRENCIES = {
  //NOTE:minimum transaction amount that Stripe allows for each currency. This is a hard limit imposed by Stripe's payment processing system
  USD: { code: "USD", symbol: "$", name: "US Dollar", minAmount: 0.5 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", minAmount: 0.5 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", minAmount: 0.3 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", minAmount: 0.5 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", minAmount: 0.5 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", minAmount: 50 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", minAmount: 0.5 },
};

export const formatCurrency = (amount, currencyCode = "USD") => {
  const currency = SUPPORTED_CURRENCIES[currencyCode];
  if (!currency) return `$${amount.toFixed(2)}`;

  const decimals = currencyCode === "JPY" ? 0 : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const getCurrencyMultiplier = (currencyCode = "USD") => {
  return currencyCode === "JPY" ? 1 : 100;
};

export const validateEntryFee = (amount, currencyCode = "USD") => {
  const currency = SUPPORTED_CURRENCIES[currencyCode];
  if (!currency) return { valid: false, message: "Invalid currency" };

  if (amount < currency.minAmount) {
    return {
      valid: false,
      message: `Minimum entry fee for ${currencyCode} is ${formatCurrency(currency.minAmount, currencyCode)}`,
    };
  }

  return { valid: true };
};
