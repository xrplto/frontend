import React from 'react';

const CodeExamples = () => {
  const getCodeExample = (language, section) => {
    switch (section) {
      case 'get-all-tokens':
        switch (language) {
          case 'shell':
            return `curl -sS "https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter="`;
          case 'ruby':
            return `require 'net/http'
require 'json'

uri = URI('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=')
response = Net::HTTP.get(uri)
tokens = JSON.parse(response)`;
          case 'python':
            return `import requests

response = requests.get('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=')
tokens = response.json()`;
          case 'javascript':
            return `const axios = require('axios');

const res = await axios.get('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=');

const tokens = res.data;`;
          default:
            return '';
        }

      case 'get-specific-token-info':
        switch (language) {
          case 'shell':
            return `# Using issuer_currencyCode (recommended)
curl -sS "https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD"

# Alternatively, you can use a slug or md5 value
slug="your_slug_here"
curl -sS "https://api.xrpl.to/api/token/$slug?desc=no"`;
          case 'javascript':
            return `const axios = require('axios');

async function getTokenInfo(issuer, currency) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/token/\${issuer}_\${currency}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

// Example usage
getTokenInfo('rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', 'USD')
  .then(tokenInfo => console.log(tokenInfo))
  .catch(error => console.error(error));`;
          case 'python':
            return `import requests

def get_token_info(issuer, currency):
    try:
        response = requests.get(f"https://api.xrpl.to/api/token/{issuer}_{currency}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching token info: {e}")
        return None

# Example usage
issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency = "USD"
token_info = get_token_info(issuer, currency)
if token_info:
    print(token_info)`;
          case 'ruby':
            return `require 'net/http'
require 'json'

def get_token_info(issuer, currency)
  uri = URI("https://api.xrpl.to/api/token/#{issuer}_#{currency}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching token info: #{e.message}"
  nil
end

# Example usage
issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency = "USD"
token_info = get_token_info(issuer, currency)
puts token_info if token_info`;
          default:
            return '';
        }

      case 'get-sparkline-of-a-token':
        switch (language) {
          case 'shell':
            return `curl -sS "https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607"`;
          case 'javascript':
            return `const axios = require('axios');

async function getTokenSparkline(tokenId) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/sparkline/\${tokenId}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token sparkline:', error);
    return null;
  }
}

// Example usage
const tokenId = '0413ca7cfc258dfaf698c02fe304e607';
getTokenSparkline(tokenId)
  .then(sparklineData => console.log(sparklineData))
  .catch(error => console.error(error));`;
          case 'python':
            return `import requests

def get_token_sparkline(token_id):
    try:
        response = requests.get(f"https://api.xrpl.to/api/sparkline/{token_id}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching token sparkline: {e}")
        return None

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
sparkline_data = get_token_sparkline(token_id)
if sparkline_data:
    print(sparkline_data)`;
          case 'ruby':
            return `require 'net/http'
require 'json'

def get_token_sparkline(token_id)
  uri = URI("https://api.xrpl.to/api/sparkline/#{token_id}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching token sparkline: #{e.message}"
  nil
end

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
sparkline_data = get_token_sparkline(token_id)
puts sparkline_data if sparkline_data`;
          default:
            return '';
        }

      case 'get-rich-list-of-a-token':
        switch (language) {
          case 'shell':
            return `curl -sS "https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=20"`;
          case 'javascript':
            return `const axios = require('axios');

async function getRichList(tokenId, start = 0, limit = 20) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/richlist/\${tokenId}?start=\${start}&limit=\${limit}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rich list:', error);
    return null;
  }
}

// Example usage
const tokenId = '0413ca7cfc258dfaf698c02fe304e607';
getRichList(tokenId)
  .then(richList => console.log(richList))
  .catch(error => console.error(error));`;
          case 'python':
            return `import requests

def get_rich_list(token_id, start=0, limit=20):
    try:
        response = requests.get(f"https://api.xrpl.to/api/richlist/{token_id}?start={start}&limit={limit}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching rich list: {e}")
        return None

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
rich_list = get_rich_list(token_id)
if rich_list:
    print(rich_list)`;
          case 'ruby':
            return `require 'net/http'
require 'json'

def get_rich_list(token_id, start=0, limit=20)
  uri = URI("https://api.xrpl.to/api/richlist/#{token_id}?start=#{start}&limit=#{limit}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching rich list: #{e.message}"
  nil
end

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
rich_list = get_rich_list(token_id)
puts rich_list if rich_list`;
          default:
            return '';
        }

      case 'get-exchange-history-of-a-token':
        switch (language) {
          case 'shell':
            return `curl -sS "https://api.xrpl.to/api/history?md5=0413ca7cfc258dfaf698c02fe304e607&page=0&limit=10"`;
          case 'javascript':
            return `const axios = require('axios');

async function getExchangeHistory(md5, page = 0, limit = 10) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/history?md5=\${md5}&page=\${page}&limit=\${limit}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exchange history:', error);
    return null;
  }
}

// Example usage
const md5 = '0413ca7cfc258dfaf698c02fe304e607';
getExchangeHistory(md5)
  .then(history => console.log(history))
  .catch(error => console.error(error));`;
          case 'python':
            return `import requests

def get_exchange_history(md5, page=0, limit=10):
    try:
        response = requests.get(f"https://api.xrpl.to/api/history?md5={md5}&page={page}&limit={limit}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching exchange history: {e}")
        return None

# Example usage
md5 = "0413ca7cfc258dfaf698c02fe304e607"
history = get_exchange_history(md5)
if history:
    print(history)`;
          case 'ruby':
            return `require 'net/http'
require 'json'

def get_exchange_history(md5, page=0, limit=10)
  uri = URI("https://api.xrpl.to/api/history?md5=#{md5}&page=#{page}&limit=#{limit}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching exchange history: #{e.message}"
  nil
end

# Example usage
md5 = "0413ca7cfc258dfaf698c02fe304e607"
history = get_exchange_history(md5)
puts history if history`;
          default:
            return '';
        }

      case 'get-the-current-status':
        switch (language) {
          case 'shell':
            return `curl -sS "https://api.xrpl.to/api/status"`;
          case 'javascript':
            return `const axios = require('axios');

async function getCurrentStatus() {
  try {
    const response = await axios.get('https://api.xrpl.to/api/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching current status:', error);
    return null;
  }
}

// Example usage
getCurrentStatus()
  .then(status => console.log(status))
  .catch(error => console.error(error));`;
          case 'python':
            return `import requests

def get_current_status():
    try:
        response = requests.get("https://api.xrpl.to/api/status")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching current status: {e}")
        return None

# Example usage
status = get_current_status()
if status:
    print(status)`;
          case 'ruby':
            return `require 'net/http'
require 'json'

def get_current_status
  uri = URI("https://api.xrpl.to/api/status")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching current status: #{e.message}"
  nil
end

# Example usage
status = get_current_status
puts status if status`;
          default:
            return '';
        }

      case 'get-account-offers':
        switch (language) {
          case 'shell':
            return `curl -sS "https://api.xrpl.to/api/account/offers/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"`;
          case 'javascript':
            return `const axios = require('axios');

async function getAccountOffers(account) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/account/offers/\${account}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account offers:', error);
    return null;
  }
}

// Example usage
const account = 'rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6';
getAccountOffers(account)
  .then(offers => console.log(offers))
  .catch(error => console.error(error));`;
          case 'python':
            return `import requests

def get_account_offers(account):
    try:
        response = requests.get(f"https://api.xrpl.to/api/account/offers/{account}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching account offers: {e}")
        return None

# Example usage
account = "rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
offers = get_account_offers(account)
if offers:
    print(offers)`;
          case 'ruby':
            return `require 'net/http'
require 'json'

def get_account_offers(account)
  uri = URI("https://api.xrpl.to/api/account/offers/#{account}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching account offers: #{e.message}"
  nil
end

# Example usage
account = "rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
offers = get_account_offers(account)
puts offers if offers`;
          default:
            return '';
        }

      default:
        return '';
    }
  };

  return { getCodeExample };
};

export default CodeExamples;
