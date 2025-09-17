const express = require('express');
const axios = require('axios');

const router = express.Router();

// Cache for exchange rates (in production, use Redis)
let ratesCache = {
  data: null,
  lastUpdated: null,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// Get current exchange rates
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check if we have cached data that's still valid
    if (ratesCache.data && ratesCache.lastUpdated && 
        (now - ratesCache.lastUpdated) < ratesCache.ttl) {
      return res.json({
        success: true,
        rates: ratesCache.data,
        cached: true,
        lastUpdated: ratesCache.lastUpdated
      });
    }

    // Fetch fresh rates from external API
    const rates = await fetchExchangeRates();
    
    // Update cache
    ratesCache.data = rates;
    ratesCache.lastUpdated = now;

    res.json({
      success: true,
      rates,
      cached: false,
      lastUpdated: now
    });

  } catch (error) {
    console.error('Get exchange rates error:', error);
    
    // Return cached data if available, even if stale
    if (ratesCache.data) {
      return res.json({
        success: true,
        rates: ratesCache.data,
        cached: true,
        stale: true,
        lastUpdated: ratesCache.lastUpdated,
        warning: 'Using cached rates due to API error'
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// Convert between currencies
router.post('/convert', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    
    if (!fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: fromCurrency, toCurrency, amount' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Get current rates (use internal function to avoid circular call)
    const rates = await fetchExchangeRates();

    // Perform conversion
    const conversion = convertCurrency(fromCurrency, toCurrency, amount, rates);
    
    if (!conversion.success) {
      return res.status(400).json({ error: conversion.error });
    }

    res.json({
      success: true,
      conversion: {
        fromCurrency,
        toCurrency,
        fromAmount: amount,
        toAmount: conversion.convertedAmount,
        exchangeRate: conversion.rate,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// Helper function to fetch exchange rates from external APIs
async function fetchExchangeRates() {
  try {
    // Using CoinGecko API for crypto prices (free tier)
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'algorand,usd-coin,euro-coin,brazilian-digital-token',
        vs_currencies: 'usd,eur,brl,inr',
        include_24hr_change: true,
        include_last_updated_at: true
      },
      timeout: 10000
    });

    const data = response.data;
    
    // Format rates for our supported currencies
    const rates = {
      ALGO: {
        USD: data.algorand?.usd || 0,
        EUR: data.algorand?.eur || 0,
        BRL: data.algorand?.brl || 0,
        INR: data.algorand?.inr || 0,
        change24h: data.algorand?.usd_24h_change || 0
      },
      USDC: {
        USD: data['usd-coin']?.usd || 1,
        EUR: data['usd-coin']?.eur || 0.85,
        BRL: data['usd-coin']?.brl || 5.0,
        INR: data['usd-coin']?.inr || 83.0,
        change24h: data['usd-coin']?.usd_24h_change || 0
      },
      EURC: {
        USD: data['euro-coin']?.usd || 1.18,
        EUR: data['euro-coin']?.eur || 1,
        BRL: data['euro-coin']?.brl || 5.9,
        INR: data['euro-coin']?.inr || 98.0,
        change24h: data['euro-coin']?.eur_24h_change || 0
      },
      BRZ: {
        USD: data['brazilian-digital-token']?.usd || 0.20,
        EUR: data['brazilian-digital-token']?.eur || 0.17,
        BRL: data['brazilian-digital-token']?.brl || 1,
        INR: data['brazilian-digital-token']?.inr || 16.6,
        change24h: data['brazilian-digital-token']?.brl_24h_change || 0
      },
      INR: {
        USD: 0.012,
        EUR: 0.010,
        BRL: 0.060,
        INR: 1,
        change24h: 0
      }
    };

    return rates;

  } catch (error) {
    console.error('Error fetching rates from CoinGecko:', error.message);
    
    // Fallback to static rates if API fails
    return {
      ALGO: { USD: 0.25, EUR: 0.21, BRL: 1.25, INR: 20.75, change24h: 0 },
      USDC: { USD: 1.00, EUR: 0.85, BRL: 5.00, INR: 83.00, change24h: 0 },
      EURC: { USD: 1.18, EUR: 1.00, BRL: 5.90, INR: 98.00, change24h: 0 },
      BRZ: { USD: 0.20, EUR: 0.17, BRL: 1.00, INR: 16.60, change24h: 0 },
      INR: { USD: 0.012, EUR: 0.010, BRL: 0.060, INR: 1.00, change24h: 0 }
    };
  }
}

// Helper function to convert between currencies
function convertCurrency(fromCurrency, toCurrency, amount, rates) {
  try {
    if (fromCurrency === toCurrency) {
      return {
        success: true,
        convertedAmount: amount,
        rate: 1
      };
    }

    const fromRates = rates[fromCurrency];
    const toRates = rates[toCurrency];

    if (!fromRates || !toRates) {
      return {
        success: false,
        error: 'Unsupported currency pair'
      };
    }

    // Convert through USD as base currency
    const amountInUSD = fromRates.USD * amount;
    const convertedAmount = amountInUSD / toRates.USD;
    const rate = fromRates.USD / toRates.USD;

    return {
      success: true,
      convertedAmount: parseFloat(convertedAmount.toFixed(6)),
      rate: parseFloat(rate.toFixed(6))
    };

  } catch (error) {
    return {
      success: false,
      error: 'Conversion calculation failed'
    };
  }
}

module.exports = router;
