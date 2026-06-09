import axios from 'axios';
import { load } from 'cheerio';
import NodeCache from 'node-cache';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';

// Cache for scraped medicines (60 minute TTL)
const cache = new NodeCache({ stdTTL: 3600 });
const execFileAsync = promisify(execFile);
const ALL_SCRAPED_CACHE_KEY = 'all_scraped_medicines';
const FIRST_RESULT_WAIT_MS = parseInt(process.env.SCRAPE_FIRST_RESULT_WAIT_MS || '2000', 10);

/**
 * Scrape medicines from popular pharmacy websites
 */
class MedicineScraperService {
  constructor() {
    const configuredMaxPages = parseInt(process.env.AROGGA_MAX_PAGES || '10', 10);
    this.aroggaMaxPages = Number.isFinite(configuredMaxPages)
      ? Math.min(Math.max(configuredMaxPages, 1), 25)
      : 10;

    this.sources = [
      {
        name: 'Arogga',
        url: 'https://www.arogga.com/products?source=prescribed_medicine_web&_tags=product_tag_prescribed_medicine&_order=pv_allow_sales%3Adesc%2Cp_weight%3Aasc&_haveImage=1&_is_base=1&_override_with_link_params=1',
        parser: this.parseArogga
      }
      // OsudPotro disabled - uses JavaScript rendering (requires Puppeteer)
      // To add: implement parseOsudPotro with headless browser support
    ];

    this.activeScrapePromise = null;
    this.lastScrapeStartedAt = null;
    this.lastScrapeCompletedAt = null;
    this.lastScrapeError = null;
  }

  getScrapeStatus() {
    const cached = cache.get(ALL_SCRAPED_CACHE_KEY) || [];

    return {
      inProgress: Boolean(this.activeScrapePromise),
      cachedCount: cached.length,
      lastScrapeStartedAt: this.lastScrapeStartedAt,
      lastScrapeCompletedAt: this.lastScrapeCompletedAt,
      lastScrapeError: this.lastScrapeError
    };
  }

  async waitForWithTimeout(promise, timeoutMs) {
    if (!promise) {
      return null;
    }

    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
    ]);
  }

  /**
   * Ensure a Puppeteer browser binary is installed before launch.
   */
  async ensurePuppeteerBrowserInstalled() {
    try {
      const executable = puppeteer.executablePath();
      if (executable) {
        return executable;
      }
    } catch (error) {
      console.log(`⚠️ Puppeteer executable not found yet: ${error.message}`);
    }

    console.log('📦 Installing Puppeteer Chrome browser (first-time setup)...');

    const cliPath = path.resolve(process.cwd(), 'node_modules', 'puppeteer', 'lib', 'cjs', 'puppeteer', 'node', 'cli.js');
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');

    try {
      await execFileAsync(process.execPath, [cliPath, 'browsers', 'install', 'chrome'], {
        env: { ...process.env, PUPPETEER_CACHE_DIR: cacheDir },
        timeout: 300000,
        windowsHide: true
      });

      const executable = puppeteer.executablePath();
      if (executable) {
        console.log(`✅ Puppeteer browser ready at: ${executable}`);
        return executable;
      }
    } catch (installError) {
      console.error('❌ Failed to install Puppeteer browser:', installError.message);
    }

    return null;
  }

  /**
   * Configure Puppeteer page for faster scraping.
   */
  async setupAroggaPage(page) {
    await page.setDefaultNavigationTimeout(45000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9'
    });

    // Block heavy assets that are not required for extracting product links/text.
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  /**
   * Extract medicines from the current Arogga page.
   */
  async extractAroggaMedicines(page) {
    const medicines = await page.evaluate(() => {
      const items = [];
      const links = document.querySelectorAll('a[href*="/product/"]');

      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        let text = link.textContent.trim();

        text = text.replace(/\d+-\d+\s+HOURS\s*/gi, '').trim();
        text = text.replace(/^\d+%\s*OFF\s*/gi, '').trim();

        const priceMatch = text.match(/৳\s*([\d,.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

        const nameMatch = text.match(/^([A-Za-z\\s]+?)(?:\\s*\\d+(?:mg|mcg|ml)|৳|$)/);
        const name = nameMatch ? nameMatch[1].trim() : text.split('৳')[0].trim();

        const dosageMatch = text.match(/(\\d+(?:mg|mcg|ml|units?|%))/);
        const dosage = dosageMatch ? dosageMatch[1] : '';

        let imageUrl = '';
        const parent = link.parentElement;

        if (parent) {
          const allImgs = parent.querySelectorAll('img');

          for (let img of allImgs) {
            const src = img.src || img.getAttribute('data-src') || '';
            const alt = img.getAttribute('alt') || '';

            if (src.includes('icon') || src.includes('badge') || src.includes('svg') || src.includes('logo')) {
              continue;
            }

            if (alt && name && (
              alt.toLowerCase().includes(name.toLowerCase().substring(0, 6)) ||
              name.toLowerCase().includes(alt.toLowerCase()) ||
              alt.toLowerCase() === name.toLowerCase()
            )) {
              imageUrl = src;
              break;
            }
          }

          if (!imageUrl) {
            for (let img of allImgs) {
              const src = img.src || img.getAttribute('data-src') || '';
              const className = img.className || '';

              if (src && !src.includes('icon') && !src.includes('badge') && !src.includes('svg') &&
                  (className.includes('object-contain') || className.includes('product') || className.includes('image'))) {
                imageUrl = src;
                break;
              }
            }
          }

          if (!imageUrl) {
            for (let img of allImgs) {
              const src = img.src || img.getAttribute('data-src') || '';
              if (src && !src.includes('icon') && !src.includes('badge') && !src.includes('svg')) {
                imageUrl = src;
                break;
              }
            }
          }
        }

        if (name && price > 0 && name.length > 2) {
          items.push({
            name: name.substring(0, 100),
            price,
            dosage,
            href: href.startsWith('http') ? href : `https://www.arogga.com${href}`,
            imageUrl: imageUrl || ''
          });
        }
      });

      return items;
    });

    return medicines.map(med => ({
      _id: this.generateMedicineId(med.name, 'Arogga'),
      name: med.name,
      manufacturer: 'Arogga',
      price: med.price,
      description: `${med.dosage} - Available at Arogga with fast delivery`,
      category: this.categorizeByName(med.name + ' ' + med.dosage),
      inStock: true,
      source: 'Arogga',
      sourceUrl: med.href,
      imageUrl: med.imageUrl
    }));
  }

  /**
   * Parse medicines from Arogga using a single browser session for all pages.
   */
  async parseAroggaPagesWithPuppeteer(baseUrl, maxPages = 3) {
    let browser;
    try {
      console.log('🤖 Launching Puppeteer for Arogga (optimized single session)...');
      const executablePath = await this.ensurePuppeteerBrowserInstalled();

      if (!executablePath) {
        throw new Error('No Puppeteer browser executable is available. Run: npx puppeteer browsers install chrome');
      }

      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await this.setupAroggaPage(page);

      let allMedicines = [];
      for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
        const pageUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_page=${pageNumber}`;
        console.log(`📖 Fetching Arogga page ${pageNumber}...`);

        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

        await page.waitForSelector('a[href*="/product/"]', { timeout: 7000 }).catch(() => {
          console.log(`⚠️ Product containers delayed on page ${pageNumber}, extracting anyway...`);
        });

        const pageMedicines = await this.extractAroggaMedicines(page);

        if (pageMedicines.length === 0) {
          console.log(`Arogga page ${pageNumber} returned no results, stopping pagination`);
          break;
        }

        allMedicines = allMedicines.concat(pageMedicines);
        console.log(`✅ Fetched ${pageMedicines.length} medicines from Arogga page ${pageNumber}`);
      }

      return allMedicines;
    } catch (error) {
      console.error('❌ Error parsing Arogga pages with Puppeteer:', error.message);
      return [];
    } finally {
      if (browser) {
        await browser.close();
        console.log('🔌 Puppeteer browser closed');
      }
    }
  }

  /**
   * Backward-compatible single page parser.
   */
  async parseAroggaWithPuppeteer(url) {
    return this.parseAroggaPagesWithPuppeteer(url, 1);
  }

  /**
   * Parse medicines from OnlyMeds
   */
  async parseOnlyMeds(html) {
    try {
      const $ = load(html);
      const medicines = [];

      $('.product, .item, [data-medicine]').each((index, element) => {
        const $element = $(element);
        
        const medicine = {
          _id: this.generateMedicineId(
            $element.find('.name, .title, h2').text().trim(),
            'OnlyMeds'
          ),
          name: $element.find('.name, .title, h2').text().trim(),
          manufacturer: $element.find('.maker, .brand').text().trim(),
          price: this.extractPrice($element.find('.cost, .amount, .pricing').text()),
          description: $element.find('.info, .content').text().trim(),
          category: this.categorizeByName($element.find('.name, .title').text()),
          inStock: !$element.find('.sold-out, .disabled').length,
          source: 'OnlyMeds',
          sourceUrl: $element.find('a').attr('href') || '',
          imageUrl: $element.find('img').attr('src') || '',
        };

        if (medicine.name && medicine.price) {
          medicines.push(medicine);
        }
      });

      return medicines;
    } catch (error) {
      console.error('Error parsing OnlyMeds:', error);
      return [];
    }
  }

  /**
   * Parse medicines from OsudPotro (Bangladesh online pharmacy)
   */
  async parseOsudPotro(html) {
    try {
      const $ = load(html);
      const medicines = [];

      // Extract all text from the page
      const bodyText = $('body').text();
      
      // Look for medicine product links
      $('a').each((index, element) => {
        const $element = $(element);
        const href = $element.attr('href') || '';
        let text = $element.text().trim();
        const parent = $element.parent().text();
        
        // Skip non-product pages
        if (!href || href.includes('category') || href.includes('tag') || href.includes('manufacturer') || href.includes('contact')) {
          return;
        }
        
        // Skip if URL is too short (likely navigation)
        if (href.length < 10) {
          return;
        }
        
        // Get price info from parent context
        let priceMatch = parent.match(/৳\s*([\d.]+)/);
        if (!priceMatch) {
          priceMatch = text.match(/৳\s*([\d.]+)/);
        }
        
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Only add if we have a reasonable name and price
        if (text && price > 0 && text.length > 3 && text.length < 150) {
          // Check if not already added
          const isDuplicate = medicines.find(m => m.name.toLowerCase() === text.toLowerCase());
          
          if (!isDuplicate) {
            medicines.push({
              _id: this.generateMedicineId(text, 'OsudPotro'),
              name: text.substring(0, 100),
              manufacturer: 'OsudPotro',
              price,
              description: 'Medicine from OsudPotro',
              category: this.categorizeByName(text),
              inStock: true,
              source: 'OsudPotro',
              sourceUrl: href.startsWith('http') ? href : `https://osudpotro.com${href}`,
              imageUrl: '',
            });
          }
        }
      });

      // If still no medicines, try extracting from page text using price indicators
      if (medicines.length === 0) {
        const lines = bodyText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Look for lines with prices
          const priceMatch = line.match(/৳\s*([\d.]+)/);
          if (priceMatch && (line.includes('Tablet') || line.includes('Capsule') || line.includes('mg') || line.includes('ml'))) {
            // Try to extract medicine name
            const nameMatch = line.match(/^([A-Za-z\s]+?)(?:\d+(?:mg|ml|mcg)|৳)/);
            const name = nameMatch ? nameMatch[1].trim() : line.split('৳')[0].trim();
            
            if (name && name.length > 3 && name.length < 100) {
              medicines.push({
                _id: this.generateMedicineId(name, 'OsudPotro'),
                name,
                manufacturer: 'OsudPotro',
                price: parseFloat(priceMatch[1]),
                description: 'Medicine from OsudPotro',
                category: this.categorizeByName(name),
                inStock: true,
                source: 'OsudPotro',
                sourceUrl: 'https://osudpotro.com/category/buy-prescribe-medicine-online-in-dhaka',
                imageUrl: '',
              });
            }
          }
        }
      }

      console.log(`Parsed ${medicines.length} medicines from OsudPotro`);
      return medicines;
    } catch (error) {
      console.error('Error parsing OsudPotro:', error.message);
      return [];
    }
  }

  /**
   * Extract price from text
   */
  extractPrice(text) {
    const priceMatch = text.match(/\d+([.,]\d{1,2})?/);
    if (priceMatch) {
      return parseFloat(priceMatch[0].replace(',', '.'));
    }
    return 0;
  }

  /**
   * Categorize medicine by name
   */
  categorizeByName(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('tablet')) return 'Tablet';
    if (nameLower.includes('capsule')) return 'Capsule';
    if (nameLower.includes('syrup') || nameLower.includes('solution')) return 'Syrup';
    if (nameLower.includes('injection') || nameLower.includes('injectable')) return 'Injection';
    if (nameLower.includes('ointment') || nameLower.includes('cream') || nameLower.includes('lotion')) return 'Ointment';
    if (nameLower.includes('drop') || nameLower.includes('eye drop') || nameLower.includes('ear drop')) return 'Drops';
    if (nameLower.includes('inhaler') || nameLower.includes('spray')) return 'Inhaler';
    if (nameLower.includes('suppository')) return 'Suppository';
    
    return 'Other';
  }

  /**
   * Generate unique ID for scraped medicine
   * Uses medicine name and source to create a deterministic hash
   */
  generateMedicineId(name, source) {
    const input = `${name.toLowerCase().trim()}_${source.toLowerCase().trim()}`;
    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * Fetch medicines from a source with timeout (handles pagination)
   */
  async fetchFromSource(source, force = false) {
    try {
      const cacheKey = source.name === 'Arogga'
        ? `medicine_${source.name}_pages_${this.aroggaMaxPages}`
        : `medicine_${source.name}`;
      
      // Check cache first
      const cachedData = !force ? cache.get(cacheKey) : null;
      if (cachedData) {
        console.log(`Returning cached medicines from ${source.name}`);
        return cachedData;
      }

      console.log(`Fetching medicines from ${source.name}...`);
      let allMedicines = [];
      
      // For Arogga, use Puppeteer with pagination
      if (source.name === 'Arogga') {
        console.log(`🔢 Arogga pagination depth: ${this.aroggaMaxPages} pages`);
        allMedicines = await this.parseAroggaPagesWithPuppeteer(source.url, this.aroggaMaxPages);
      } else {
        // For other sources, fetch single page with axios
        const response = await axios.get(source.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        allMedicines = await source.parser.call(this, response.data);
      }
      
      // Remove duplicates by medicine name
      const uniqueMedicines = [];
      const seenNames = new Set();
      for (const med of allMedicines) {
        if (!seenNames.has(med.name.toLowerCase())) {
          seenNames.add(med.name.toLowerCase());
          uniqueMedicines.push(med);
        }
      }
      
      // Cache the results
      cache.set(cacheKey, uniqueMedicines);
      
      console.log(`Successfully scraped ${uniqueMedicines.length} unique medicines from ${source.name}`);
      return uniqueMedicines;
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error.message);
      return [];
    }
  }

  /**
   * Start scraping in background without blocking callers.
   */
  startBackgroundScrape(options = {}) {
    const { force = false, reason = 'background' } = options;

    if (this.activeScrapePromise) {
      return {
        started: false,
        inProgress: true,
        reason,
        cachedCount: (cache.get(ALL_SCRAPED_CACHE_KEY) || []).length
      };
    }

    this.scrapeAllSources({ force })
      .then((medicines) => {
        console.log(`✅ Background scrape finished (${reason}) with ${medicines.length} medicines`);
      })
      .catch((error) => {
        console.error(`❌ Background scrape failed (${reason}):`, error.message);
      });

    return {
      started: true,
      inProgress: true,
      reason,
      cachedCount: (cache.get(ALL_SCRAPED_CACHE_KEY) || []).length
    };
  }

  /**
   * Scrape all sources
   */
  async scrapeAllSources(options = {}) {
    const { force = false } = options;

    try {
      if (!force) {
        const cachedAll = cache.get(ALL_SCRAPED_CACHE_KEY);
        if (cachedAll) {
          return cachedAll;
        }
      }

      if (this.activeScrapePromise) {
        return this.activeScrapePromise;
      }

      this.lastScrapeStartedAt = new Date().toISOString();
      this.lastScrapeError = null;

      this.activeScrapePromise = (async () => {
        const allSourceMedicines = await Promise.all(
          this.sources.map((source) => this.fetchFromSource(source, force))
        );

        const allMedicines = allSourceMedicines.flat();
        cache.set(ALL_SCRAPED_CACHE_KEY, allMedicines);
        this.lastScrapeCompletedAt = new Date().toISOString();

        console.log(`Total medicines scraped from all sources: ${allMedicines.length}`);
        return allMedicines;
      })();

      return await this.activeScrapePromise;
    } catch (error) {
      this.lastScrapeError = error.message;
      console.error('Error scraping all sources:', error);
      return [];
    } finally {
      this.activeScrapePromise = null;
    }
  }

  /**
   * Search scraped medicines
   */
  async searchScrapedMedicines(query, filters = {}) {
    try {
      // First try cache
      const cacheKey = ALL_SCRAPED_CACHE_KEY;
      let allMedicines = cache.get(cacheKey);

      if (!allMedicines) {
        this.startBackgroundScrape({ reason: 'search_miss' });

        // Wait a short time for first results; if still scraping, return fast.
        const warmData = await this.waitForWithTimeout(this.activeScrapePromise, FIRST_RESULT_WAIT_MS);
        if (warmData && Array.isArray(warmData)) {
          allMedicines = warmData;
        } else {
          allMedicines = [];
        }
      }

      // Filter medicines based on query and filters
      let filtered = allMedicines;

      // Search by name or manufacturer
      if (query) {
        const queryLower = query.toLowerCase();
        filtered = filtered.filter(med => 
          med.name.toLowerCase().includes(queryLower) ||
          med.manufacturer.toLowerCase().includes(queryLower) ||
          med.description.toLowerCase().includes(queryLower)
        );
      }

      // Filter by category
      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(med => med.category === filters.category);
      }

      // Filter by price range
      if (filters.minPrice || filters.maxPrice) {
        filtered = filtered.filter(med => {
          const price = med.price;
          if (filters.minPrice && price < filters.minPrice) return false;
          if (filters.maxPrice && price > filters.maxPrice) return false;
          return true;
        });
      }

      // Filter in stock only
      if (filters.inStockOnly) {
        filtered = filtered.filter(med => med.inStock);
      }

      // Sort results
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price_asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
          case 'price_desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
          case 'name_asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'name_desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
          default:
            break;
        }
      }

      return filtered;
    } catch (error) {
      console.error('Error searching scraped medicines:', error);
      return [];
    }
  }

  /**
   * Clear cache for a specific source or all
   */
  clearCache(sourceName = null) {
    if (sourceName) {
      const sourceKey = `medicine_${sourceName}`;
      const sourcePagesKey = `medicine_${sourceName}_pages_${this.aroggaMaxPages}`;
      cache.del(sourceKey);
      cache.del(sourcePagesKey);
      cache.del(ALL_SCRAPED_CACHE_KEY);
      console.log(`Cache cleared for ${sourceName}`);
    } else {
      cache.flushAll();
      console.log('All caches cleared');
    }
  }
}

export default new MedicineScraperService();
