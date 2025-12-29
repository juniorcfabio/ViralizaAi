// Serviço de Geolocalização e Detecção de Idioma Global
export interface LocationData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  currency: string;
  language: string;
  ip: string;
}

export interface GlobalMarketData {
  currency: string;
  currencySymbol: string;
  paymentMethods: string[];
  taxRate: number;
  priceMultiplier: number;
  popularNiches: string[];
  culturalPreferences: string[];
}

// Base de dados global de mercados
const GLOBAL_MARKETS: Record<string, GlobalMarketData> = {
  'US': {
    currency: 'USD',
    currencySymbol: '$',
    paymentMethods: ['stripe', 'paypal', 'apple_pay', 'google_pay'],
    taxRate: 0.08,
    priceMultiplier: 1.0,
    popularNiches: ['e-commerce', 'saas', 'fitness', 'real_estate', 'coaching'],
    culturalPreferences: ['direct_marketing', 'testimonials', 'urgency']
  },
  'BR': {
    currency: 'BRL',
    currencySymbol: 'R$',
    paymentMethods: ['stripe', 'pix', 'boleto', 'mercado_pago'],
    taxRate: 0.05,
    priceMultiplier: 5.2,
    popularNiches: ['afiliados', 'infoprodutos', 'consultoria', 'ecommerce', 'servicos'],
    culturalPreferences: ['social_proof', 'community', 'family_values']
  },
  'GB': {
    currency: 'GBP',
    currencySymbol: '£',
    paymentMethods: ['stripe', 'paypal', 'klarna'],
    taxRate: 0.20,
    priceMultiplier: 0.8,
    popularNiches: ['fintech', 'property', 'education', 'healthcare', 'sustainability'],
    culturalPreferences: ['professionalism', 'understatement', 'quality']
  },
  'DE': {
    currency: 'EUR',
    currencySymbol: '€',
    paymentMethods: ['stripe', 'sepa', 'sofort', 'giropay'],
    taxRate: 0.19,
    priceMultiplier: 0.9,
    popularNiches: ['automotive', 'engineering', 'manufacturing', 'green_tech', 'b2b'],
    culturalPreferences: ['precision', 'efficiency', 'data_privacy']
  },
  'JP': {
    currency: 'JPY',
    currencySymbol: '¥',
    paymentMethods: ['stripe', 'konbini', 'bank_transfer'],
    taxRate: 0.10,
    priceMultiplier: 110,
    popularNiches: ['technology', 'gaming', 'anime', 'fashion', 'food'],
    culturalPreferences: ['respect', 'quality', 'innovation']
  },
  'CN': {
    currency: 'CNY',
    currencySymbol: '¥',
    paymentMethods: ['alipay', 'wechat_pay', 'unionpay'],
    taxRate: 0.13,
    priceMultiplier: 7.2,
    popularNiches: ['ecommerce', 'manufacturing', 'technology', 'education', 'healthcare'],
    culturalPreferences: ['group_harmony', 'success_stories', 'long_term_value']
  },
  'IN': {
    currency: 'INR',
    currencySymbol: '₹',
    paymentMethods: ['razorpay', 'paytm', 'upi', 'net_banking'],
    taxRate: 0.18,
    priceMultiplier: 83,
    popularNiches: ['it_services', 'education', 'healthcare', 'fintech', 'agriculture'],
    culturalPreferences: ['value_for_money', 'family_oriented', 'tradition_modern_blend']
  },
  'AU': {
    currency: 'AUD',
    currencySymbol: 'A$',
    paymentMethods: ['stripe', 'paypal', 'afterpay'],
    taxRate: 0.10,
    priceMultiplier: 1.5,
    popularNiches: ['mining', 'agriculture', 'tourism', 'real_estate', 'sports'],
    culturalPreferences: ['laid_back', 'outdoor_lifestyle', 'mateship']
  },
  'CA': {
    currency: 'CAD',
    currencySymbol: 'C$',
    paymentMethods: ['stripe', 'paypal', 'interac'],
    taxRate: 0.13,
    priceMultiplier: 1.35,
    popularNiches: ['natural_resources', 'technology', 'healthcare', 'education', 'tourism'],
    culturalPreferences: ['politeness', 'multiculturalism', 'sustainability']
  },
  'FR': {
    currency: 'EUR',
    currencySymbol: '€',
    paymentMethods: ['stripe', 'sepa', 'carte_bancaire'],
    taxRate: 0.20,
    priceMultiplier: 0.9,
    popularNiches: ['luxury', 'fashion', 'food', 'tourism', 'art'],
    culturalPreferences: ['elegance', 'sophistication', 'cultural_pride']
  }
};

// Mapeamento de idiomas por país
const COUNTRY_LANGUAGES: Record<string, string> = {
  'US': 'en', 'GB': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en', 'ZA': 'en',
  'BR': 'pt', 'PT': 'pt', 'AO': 'pt', 'MZ': 'pt',
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es', 'CL': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es', 'BO': 'es', 'DO': 'es', 'HN': 'es', 'PY': 'es', 'SV': 'es', 'NI': 'es', 'CR': 'es', 'PA': 'es', 'UY': 'es',
  'FR': 'fr', 'LU': 'fr', 'MC': 'fr',
  'DE': 'de', 'AT': 'de', 'LI': 'de',
  'IT': 'it', 'SM': 'it', 'VA': 'it',
  'RU': 'ru', 'BY': 'ru', 'KZ': 'ru', 'KG': 'ru',
  'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
  'JP': 'ja',
  'KR': 'ko',
  'IN': 'hi', 'PK': 'hi', 'BD': 'hi',
  'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'MA': 'ar', 'DZ': 'ar', 'TN': 'ar', 'LY': 'ar', 'SD': 'ar', 'SY': 'ar', 'IQ': 'ar', 'JO': 'ar', 'LB': 'ar', 'KW': 'ar', 'QA': 'ar', 'BH': 'ar', 'OM': 'ar', 'YE': 'ar',
  'TR': 'tr',
  'NL': 'nl',
  'SE': 'sv',
  'NO': 'no',
  'DK': 'da',
  'PL': 'pl',
  'CZ': 'cs',
  'HU': 'hu',
  'RO': 'ro',
  'GR': 'el',
  'BG': 'bg',
  'HR': 'hr',
  'SK': 'sk',
  'SI': 'sl',
  'EE': 'et',
  'LV': 'lv',
  'LT': 'lt',
  'MT': 'mt',
  'CY': 'el',
  'TH': 'th',
  'VN': 'vi',
  'ID': 'id',
  'MY': 'ms',
  'PH': 'tl'
};

// Países com múltiplos idiomas (prioridade por população)
const MULTI_LANGUAGE_COUNTRIES: Record<string, string[]> = {
  'CA': ['en', 'fr'],
  'CH': ['de', 'fr', 'it'],
  'BE': ['nl', 'fr'],
  'SG': ['en', 'zh'],
  'FI': ['fi', 'sv']
};

export class GeolocationService {
  private static instance: GeolocationService;
  private locationCache: LocationData | null = null;
  private cacheExpiry: number = 0;

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  async detectUserLocation(): Promise<LocationData> {
    // Verificar cache (válido por 1 hora)
    if (this.locationCache && Date.now() < this.cacheExpiry) {
      return this.locationCache;
    }

    try {
      // Tentar múltiplas APIs de geolocalização
      const locationData = await this.tryMultipleGeoAPIs();
      
      // Cache por 1 hora
      this.locationCache = locationData;
      this.cacheExpiry = Date.now() + (60 * 60 * 1000);
      
      return locationData;
    } catch (error) {
      console.warn('Geolocation detection failed, using fallback:', error);
      return this.getFallbackLocation();
    }
  }

  private async tryMultipleGeoAPIs(): Promise<LocationData> {
    const apis = [
      () => this.getLocationFromIPAPI(),
      () => this.getLocationFromIPInfo(),
      () => this.getLocationFromCloudflare(),
      () => this.getLocationFromBrowser()
    ];

    for (const api of apis) {
      try {
        const result = await api();
        if (result) return result;
      } catch (error) {
        console.warn('Geo API failed, trying next:', error);
        continue;
      }
    }

    throw new Error('All geolocation APIs failed');
  }

  private async getLocationFromIPAPI(): Promise<LocationData> {
    // Usar HTTPS para evitar Mixed Content error
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (!data.country_code) throw new Error('IP-API failed');

    return {
      country: data.country_name || data.country,
      countryCode: data.country_code || data.country,
      region: data.region || data.region_code,
      city: data.city,
      timezone: data.timezone,
      currency: GLOBAL_MARKETS[data.country_code]?.currency || 'USD',
      language: COUNTRY_LANGUAGES[data.country_code] || 'en',
      ip: data.ip
    };
  }

  private async getLocationFromIPInfo(): Promise<LocationData> {
    const response = await fetch('https://ipinfo.io/json');
    const data = await response.json();

    return {
      country: data.country,
      countryCode: data.country,
      region: data.region,
      city: data.city,
      timezone: data.timezone,
      currency: GLOBAL_MARKETS[data.country]?.currency || 'USD',
      language: COUNTRY_LANGUAGES[data.country] || 'en',
      ip: data.ip
    };
  }

  private async getLocationFromCloudflare(): Promise<LocationData> {
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    const text = await response.text();
    const data = Object.fromEntries(
      text.split('\n').map(line => line.split('='))
    );

    return {
      country: data.loc || 'Unknown',
      countryCode: data.loc || 'US',
      region: 'Unknown',
      city: 'Unknown',
      timezone: 'UTC',
      currency: GLOBAL_MARKETS[data.loc]?.currency || 'USD',
      language: COUNTRY_LANGUAGES[data.loc] || 'en',
      ip: data.ip || 'Unknown'
    };
  }

  private async getLocationFromBrowser(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding usando coordenadas
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();

            resolve({
              country: data.countryName,
              countryCode: data.countryCode,
              region: data.principalSubdivision,
              city: data.city,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              currency: GLOBAL_MARKETS[data.countryCode]?.currency || 'USD',
              language: COUNTRY_LANGUAGES[data.countryCode] || 'en',
              ip: 'Browser-based'
            });
          } catch (error) {
            reject(error);
          }
        },
        (error) => reject(error),
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }

  private getFallbackLocation(): LocationData {
    // Detectar idioma do navegador como fallback
    const browserLang = navigator.language.split('-')[0];
    const fallbackCountry = Object.keys(COUNTRY_LANGUAGES).find(
      country => COUNTRY_LANGUAGES[country] === browserLang
    ) || 'US';

    return {
      country: 'Unknown',
      countryCode: fallbackCountry,
      region: 'Unknown',
      city: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: GLOBAL_MARKETS[fallbackCountry]?.currency || 'USD',
      language: browserLang || 'en',
      ip: 'Unknown'
    };
  }

  getMarketData(countryCode: string): GlobalMarketData {
    return GLOBAL_MARKETS[countryCode] || GLOBAL_MARKETS['US'];
  }

  formatPrice(price: number, countryCode: string): string {
    const market = this.getMarketData(countryCode);
    const localPrice = price * market.priceMultiplier;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: market.currency,
      minimumFractionDigits: market.currency === 'JPY' ? 0 : 2
    }).format(localPrice);
  }

  getCulturalPreferences(countryCode: string): string[] {
    return this.getMarketData(countryCode).culturalPreferences;
  }

  getPopularNiches(countryCode: string): string[] {
    return this.getMarketData(countryCode).popularNiches;
  }
}

export default GeolocationService;
