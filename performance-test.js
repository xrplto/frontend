#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const url = require('url');

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.testStartTime = Date.now();

    // Define test endpoints based on the Next.js pages structure
    this.endpoints = [
      '/',
      '/about',
      '/faq',
      '/news',
      '/collections',
      '/tokens-heatmap',
      '/market-metrics',
      '/careers',
      '/trending',
      '/new',
      '/most-viewed',
      '/spotlight',
      '/api-docs',
      '/backend-docs',
      '/disclaimer',
      '/privacy',
      '/terms',
      '/rules'
    ];
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      const urlObj = new URL(fullUrl);
      const requestModule = urlObj.protocol === 'https:' ? https : http;

      const startTime = performance.now();
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Performance-Tester/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          ...options.headers
        },
        timeout: options.timeout || 30000
      };

      const req = requestModule.request(requestOptions, (res) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          resolve({
            endpoint,
            statusCode: res.statusCode,
            responseTime: Math.round(responseTime * 100) / 100,
            contentLength: responseBody.length,
            headers: res.headers,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        resolve({
          endpoint,
          statusCode: 0,
          responseTime: Math.round(responseTime * 100) / 100,
          contentLength: 0,
          error: error.message,
          success: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        resolve({
          endpoint,
          statusCode: 0,
          responseTime: Math.round(responseTime * 100) / 100,
          contentLength: 0,
          error: 'Request timeout',
          success: false
        });
      });

      req.end();
    });
  }

  async testEndpoint(endpoint, iterations = 1) {
    console.log(`Testing ${endpoint}...`);
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.makeRequest(endpoint);
      results.push(result);

      if (iterations > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  async runSingleTest() {
    console.log(`\n🚀 Running single request test for ${this.baseUrl}\n`);

    for (const endpoint of this.endpoints) {
      const results = await this.testEndpoint(endpoint, 1);
      this.results.push(...results);
    }
  }

  async runLoadTest(concurrency = 5, iterations = 10) {
    console.log(
      `\n⚡ Running load test with ${concurrency} concurrent requests, ${iterations} iterations per endpoint\n`
    );

    const promises = [];

    for (const endpoint of this.endpoints) {
      for (let i = 0; i < concurrency; i++) {
        promises.push(this.testEndpoint(endpoint, iterations));
      }
    }

    const allResults = await Promise.all(promises);
    allResults.forEach((results) => {
      this.results.push(...results);
    });
  }

  calculateStats(results) {
    if (results.length === 0) return null;

    const responseTimes = results.map((r) => r.responseTime);
    const successfulRequests = results.filter((r) => r.success);
    const failedRequests = results.filter((r) => !r.success);

    responseTimes.sort((a, b) => a - b);

    return {
      totalRequests: results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: ((successfulRequests.length / results.length) * 100).toFixed(2),
      averageResponseTime: (
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      ).toFixed(2),
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)] || 0,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
    };
  }

  generateReport() {
    const totalStats = this.calculateStats(this.results);
    const endpointStats = {};

    this.endpoints.forEach((endpoint) => {
      const endpointResults = this.results.filter((r) => r.endpoint === endpoint);
      if (endpointResults.length > 0) {
        endpointStats[endpoint] = this.calculateStats(endpointResults);
      }
    });

    const report = {
      testStartTime: new Date(this.testStartTime).toISOString(),
      testEndTime: new Date().toISOString(),
      testDuration: `${((Date.now() - this.testStartTime) / 1000).toFixed(2)}s`,
      baseUrl: this.baseUrl,
      totalStats,
      endpointStats,
      rawResults: this.results
    };

    return report;
  }

  printReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('                    PERFORMANCE TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Test URL: ${report.baseUrl}`);
    console.log(`Test Duration: ${report.testDuration}`);
    console.log(`Start Time: ${report.testStartTime}`);
    console.log(`End Time: ${report.testEndTime}`);
    console.log('\n' + '-'.repeat(80));
    console.log('                     OVERALL STATISTICS');
    console.log('-'.repeat(80));

    if (report.totalStats) {
      console.log(`Total Requests: ${report.totalStats.totalRequests}`);
      console.log(`Successful Requests: ${report.totalStats.successfulRequests}`);
      console.log(`Failed Requests: ${report.totalStats.failedRequests}`);
      console.log(`Success Rate: ${report.totalStats.successRate}%`);
      console.log(`Average Response Time: ${report.totalStats.averageResponseTime}ms`);
      console.log(`Min Response Time: ${report.totalStats.minResponseTime}ms`);
      console.log(`Max Response Time: ${report.totalStats.maxResponseTime}ms`);
      console.log(`Median Response Time: ${report.totalStats.medianResponseTime}ms`);
      console.log(`95th Percentile: ${report.totalStats.p95ResponseTime}ms`);
      console.log(`99th Percentile: ${report.totalStats.p99ResponseTime}ms`);
    }

    console.log('\n' + '-'.repeat(80));
    console.log('                   ENDPOINT STATISTICS');
    console.log('-'.repeat(80));

    Object.entries(report.endpointStats).forEach(([endpoint, stats]) => {
      console.log(`\n📍 ${endpoint}`);
      console.log(`   Requests: ${stats.totalRequests} | Success Rate: ${stats.successRate}%`);
      console.log(
        `   Avg: ${stats.averageResponseTime}ms | Min: ${stats.minResponseTime}ms | Max: ${stats.maxResponseTime}ms`
      );
      console.log(
        `   Median: ${stats.medianResponseTime}ms | P95: ${stats.p95ResponseTime}ms | P99: ${stats.p99ResponseTime}ms`
      );
    });

    const failedRequests = report.rawResults.filter((r) => !r.success);
    if (failedRequests.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('                     FAILED REQUESTS');
      console.log('-'.repeat(80));
      failedRequests.forEach((req) => {
        console.log(
          `❌ ${req.endpoint} - Status: ${req.statusCode} - Error: ${req.error || 'Unknown'}`
        );
      });
    }

    console.log('\n' + '='.repeat(80));
  }

  async saveReport(report, filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `performance-report-${timestamp}.json`;
    }

    try {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${filename}`);
    } catch (error) {
      console.error(`\n❌ Failed to save report: ${error.message}`);
    }
  }

  async checkServerHealth() {
    console.log(`\n🏥 Checking server health at ${this.baseUrl}...`);

    try {
      const result = await this.makeRequest('/');
      if (result.success) {
        console.log(`✅ Server is responding (${result.responseTime}ms)`);
        return true;
      } else {
        console.log(`❌ Server health check failed: Status ${result.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Server health check failed: ${error.message}`);
      return false;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl =
    args.find((arg) => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3001';
  const testType = args.find((arg) => arg.startsWith('--type='))?.split('=')[1] || 'single';
  const concurrency =
    parseInt(args.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1]) || 5;
  const iterations =
    parseInt(args.find((arg) => arg.startsWith('--iterations='))?.split('=')[1]) || 10;
  const saveReport = args.includes('--save-report');

  console.log('🎯 XRPL Frontend Performance Tester');
  console.log('=====================================');

  const tester = new PerformanceTester(baseUrl);

  const isHealthy = await tester.checkServerHealth();
  if (!isHealthy) {
    console.log(
      '\n❌ Server appears to be down or unreachable. Please check that your server is running on ' +
        baseUrl
    );
    process.exit(1);
  }

  try {
    if (testType === 'load') {
      await tester.runLoadTest(concurrency, iterations);
    } else {
      await tester.runSingleTest();
    }

    const report = tester.generateReport();
    tester.printReport(report);

    if (saveReport) {
      await tester.saveReport(report);
    }
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceTester;
