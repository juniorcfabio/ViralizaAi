// Base de Dados Global de Nichos e Segmentos - 500+ Categorias Mundiais
export interface GlobalNiche {
  id: string;
  name: string;
  category: string;
  regions: string[];
  languages: string[];
  marketSize: 'small' | 'medium' | 'large' | 'massive';
  competitionLevel: 'low' | 'medium' | 'high' | 'extreme';
  avgRevenue: number;
  growthRate: number;
  keywords: string[];
  culturalFactors: string[];
  seasonality: string[];
  targetAudience: string[];
  painPoints: string[];
  solutions: string[];
  contentTypes: string[];
  marketingChannels: string[];
}

export const GLOBAL_NICHES: GlobalNiche[] = [
  // TECNOLOGIA & SOFTWARE
  {
    id: 'saas_b2b',
    name: 'SaaS B2B Solutions',
    category: 'Technology',
    regions: ['US', 'EU', 'APAC', 'Global'],
    languages: ['en', 'de', 'fr', 'ja', 'zh'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 50000,
    growthRate: 25,
    keywords: ['software', 'automation', 'productivity', 'enterprise', 'cloud'],
    culturalFactors: ['efficiency', 'scalability', 'ROI'],
    seasonality: ['Q4_budget_planning', 'Q1_implementation'],
    targetAudience: ['CTOs', 'IT_managers', 'business_owners'],
    painPoints: ['manual_processes', 'inefficiency', 'high_costs'],
    solutions: ['automation', 'integration', 'cost_reduction'],
    contentTypes: ['case_studies', 'demos', 'whitepapers'],
    marketingChannels: ['linkedin', 'google_ads', 'webinars']
  },
  {
    id: 'mobile_apps',
    name: 'Mobile App Development',
    category: 'Technology',
    regions: ['Global'],
    languages: ['en', 'zh', 'hi', 'es', 'pt'],
    marketSize: 'massive',
    competitionLevel: 'high',
    avgRevenue: 25000,
    growthRate: 30,
    keywords: ['mobile', 'ios', 'android', 'development', 'apps'],
    culturalFactors: ['mobile_first', 'user_experience'],
    seasonality: ['year_round'],
    targetAudience: ['startups', 'enterprises', 'entrepreneurs'],
    painPoints: ['complex_development', 'high_costs', 'time_to_market'],
    solutions: ['rapid_development', 'cost_effective', 'user_friendly'],
    contentTypes: ['app_demos', 'tutorials', 'case_studies'],
    marketingChannels: ['app_stores', 'social_media', 'tech_blogs']
  },
  {
    id: 'ai_machine_learning',
    name: 'AI & Machine Learning',
    category: 'Technology',
    regions: ['US', 'CN', 'EU', 'IN'],
    languages: ['en', 'zh', 'de', 'hi'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 75000,
    growthRate: 40,
    keywords: ['artificial_intelligence', 'machine_learning', 'deep_learning', 'neural_networks'],
    culturalFactors: ['innovation', 'future_tech', 'competitive_advantage'],
    seasonality: ['year_round'],
    targetAudience: ['data_scientists', 'tech_companies', 'researchers'],
    painPoints: ['complex_implementation', 'data_quality', 'talent_shortage'],
    solutions: ['automated_ml', 'pre_trained_models', 'consulting'],
    contentTypes: ['research_papers', 'demos', 'tutorials'],
    marketingChannels: ['tech_conferences', 'github', 'academic_journals']
  },

  // E-COMMERCE & RETAIL
  {
    id: 'dropshipping',
    name: 'Dropshipping Business',
    category: 'E-commerce',
    regions: ['US', 'EU', 'AU', 'CA'],
    languages: ['en', 'de', 'fr', 'es'],
    marketSize: 'large',
    competitionLevel: 'high',
    avgRevenue: 15000,
    growthRate: 20,
    keywords: ['dropshipping', 'ecommerce', 'online_store', 'shopify'],
    culturalFactors: ['entrepreneurship', 'passive_income'],
    seasonality: ['Q4_holidays', 'summer_products'],
    targetAudience: ['entrepreneurs', 'side_hustlers', 'students'],
    painPoints: ['supplier_issues', 'competition', 'marketing_costs'],
    solutions: ['reliable_suppliers', 'niche_products', 'automation'],
    contentTypes: ['success_stories', 'tutorials', 'product_reviews'],
    marketingChannels: ['facebook_ads', 'instagram', 'youtube']
  },
  {
    id: 'amazon_fba',
    name: 'Amazon FBA Business',
    category: 'E-commerce',
    regions: ['US', 'EU', 'JP', 'AU'],
    languages: ['en', 'de', 'fr', 'ja'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 30000,
    growthRate: 15,
    keywords: ['amazon', 'fba', 'private_label', 'product_research'],
    culturalFactors: ['brand_building', 'quality_focus'],
    seasonality: ['Q4_peak', 'back_to_school'],
    targetAudience: ['entrepreneurs', 'business_owners', 'investors'],
    painPoints: ['product_research', 'competition', 'inventory_management'],
    solutions: ['research_tools', 'optimization', 'automation'],
    contentTypes: ['case_studies', 'product_launches', 'tutorials'],
    marketingChannels: ['amazon_ppc', 'youtube', 'facebook_groups']
  },

  // SAÚDE & FITNESS
  {
    id: 'fitness_coaching',
    name: 'Personal Fitness Coaching',
    category: 'Health & Fitness',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'de', 'fr'],
    marketSize: 'large',
    competitionLevel: 'high',
    avgRevenue: 8000,
    growthRate: 18,
    keywords: ['fitness', 'personal_trainer', 'workout', 'health'],
    culturalFactors: ['body_image', 'health_consciousness'],
    seasonality: ['new_year', 'summer_prep'],
    targetAudience: ['health_conscious', 'busy_professionals', 'fitness_enthusiasts'],
    painPoints: ['lack_of_time', 'motivation', 'plateau'],
    solutions: ['personalized_plans', 'accountability', 'convenience'],
    contentTypes: ['workout_videos', 'transformation_stories', 'nutrition_guides'],
    marketingChannels: ['instagram', 'tiktok', 'fitness_apps']
  },
  {
    id: 'nutrition_wellness',
    name: 'Nutrition & Wellness',
    category: 'Health & Fitness',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'de'],
    marketSize: 'massive',
    competitionLevel: 'medium',
    avgRevenue: 12000,
    growthRate: 22,
    keywords: ['nutrition', 'wellness', 'diet', 'healthy_eating'],
    culturalFactors: ['health_trends', 'natural_living'],
    seasonality: ['new_year', 'spring_detox'],
    targetAudience: ['health_conscious', 'weight_loss_seekers', 'athletes'],
    painPoints: ['confusion_about_diet', 'lack_of_results', 'sustainability'],
    solutions: ['personalized_nutrition', 'meal_planning', 'education'],
    contentTypes: ['meal_plans', 'recipes', 'health_tips'],
    marketingChannels: ['instagram', 'pinterest', 'health_blogs']
  },

  // EDUCAÇÃO & CURSOS
  {
    id: 'online_education',
    name: 'Online Education Platforms',
    category: 'Education',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'hi', 'zh'],
    marketSize: 'massive',
    competitionLevel: 'high',
    avgRevenue: 20000,
    growthRate: 35,
    keywords: ['online_learning', 'education', 'courses', 'skills'],
    culturalFactors: ['lifelong_learning', 'career_advancement'],
    seasonality: ['back_to_school', 'new_year_resolutions'],
    targetAudience: ['students', 'professionals', 'career_changers'],
    painPoints: ['skill_gaps', 'career_stagnation', 'expensive_education'],
    solutions: ['affordable_courses', 'practical_skills', 'certification'],
    contentTypes: ['course_previews', 'success_stories', 'free_lessons'],
    marketingChannels: ['google_ads', 'youtube', 'linkedin']
  },
  {
    id: 'language_learning',
    name: 'Language Learning',
    category: 'Education',
    regions: ['Global'],
    languages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar'],
    marketSize: 'large',
    competitionLevel: 'medium',
    avgRevenue: 5000,
    growthRate: 25,
    keywords: ['language_learning', 'multilingual', 'fluency', 'conversation'],
    culturalFactors: ['globalization', 'cultural_exchange'],
    seasonality: ['new_year', 'travel_seasons'],
    targetAudience: ['travelers', 'professionals', 'students'],
    painPoints: ['lack_of_practice', 'boring_methods', 'slow_progress'],
    solutions: ['interactive_learning', 'conversation_practice', 'gamification'],
    contentTypes: ['lesson_demos', 'progress_tracking', 'cultural_content'],
    marketingChannels: ['social_media', 'travel_blogs', 'educational_platforms']
  },

  // FINANÇAS & INVESTIMENTOS
  {
    id: 'cryptocurrency',
    name: 'Cryptocurrency Trading',
    category: 'Finance',
    regions: ['Global'],
    languages: ['en', 'zh', 'ja', 'ko', 'de'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 25000,
    growthRate: 50,
    keywords: ['cryptocurrency', 'bitcoin', 'trading', 'blockchain'],
    culturalFactors: ['tech_adoption', 'financial_innovation'],
    seasonality: ['market_cycles', 'regulatory_news'],
    targetAudience: ['investors', 'tech_enthusiasts', 'traders'],
    painPoints: ['volatility', 'complexity', 'security_concerns'],
    solutions: ['education', 'risk_management', 'secure_platforms'],
    contentTypes: ['market_analysis', 'tutorials', 'news_updates'],
    marketingChannels: ['crypto_forums', 'youtube', 'telegram']
  },
  {
    id: 'personal_finance',
    name: 'Personal Finance Management',
    category: 'Finance',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'de'],
    marketSize: 'massive',
    competitionLevel: 'medium',
    avgRevenue: 8000,
    growthRate: 15,
    keywords: ['personal_finance', 'budgeting', 'savings', 'debt_management'],
    culturalFactors: ['financial_literacy', 'economic_uncertainty'],
    seasonality: ['new_year', 'tax_season'],
    targetAudience: ['young_adults', 'families', 'debt_strugglers'],
    painPoints: ['debt', 'lack_of_savings', 'financial_stress'],
    solutions: ['budgeting_tools', 'debt_strategies', 'investment_guidance'],
    contentTypes: ['budgeting_guides', 'success_stories', 'calculators'],
    marketingChannels: ['personal_finance_blogs', 'youtube', 'podcasts']
  },

  // MARKETING DIGITAL
  {
    id: 'social_media_marketing',
    name: 'Social Media Marketing',
    category: 'Digital Marketing',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'de'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 15000,
    growthRate: 20,
    keywords: ['social_media', 'marketing', 'instagram', 'facebook', 'tiktok'],
    culturalFactors: ['social_proof', 'viral_content'],
    seasonality: ['year_round', 'platform_updates'],
    targetAudience: ['businesses', 'influencers', 'marketers'],
    painPoints: ['algorithm_changes', 'content_creation', 'ROI_measurement'],
    solutions: ['content_strategies', 'automation_tools', 'analytics'],
    contentTypes: ['case_studies', 'templates', 'tutorials'],
    marketingChannels: ['social_media', 'marketing_blogs', 'webinars']
  },
  {
    id: 'seo_services',
    name: 'SEO & Content Marketing',
    category: 'Digital Marketing',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'de', 'fr'],
    marketSize: 'large',
    competitionLevel: 'high',
    avgRevenue: 12000,
    growthRate: 18,
    keywords: ['seo', 'content_marketing', 'google_ranking', 'organic_traffic'],
    culturalFactors: ['search_behavior', 'content_preferences'],
    seasonality: ['google_updates', 'seasonal_keywords'],
    targetAudience: ['businesses', 'bloggers', 'e-commerce'],
    painPoints: ['low_rankings', 'algorithm_updates', 'content_creation'],
    solutions: ['seo_optimization', 'content_strategies', 'link_building'],
    contentTypes: ['seo_audits', 'ranking_reports', 'content_calendars'],
    marketingChannels: ['google_ads', 'seo_blogs', 'linkedin']
  },

  // IMÓVEIS & CONSTRUÇÃO
  {
    id: 'real_estate_investment',
    name: 'Real Estate Investment',
    category: 'Real Estate',
    regions: ['US', 'EU', 'AU', 'CA', 'BR'],
    languages: ['en', 'es', 'pt', 'de', 'fr'],
    marketSize: 'massive',
    competitionLevel: 'high',
    avgRevenue: 50000,
    growthRate: 12,
    keywords: ['real_estate', 'property_investment', 'rental_income', 'flipping'],
    culturalFactors: ['property_ownership', 'wealth_building'],
    seasonality: ['spring_buying', 'year_end_tax'],
    targetAudience: ['investors', 'first_time_buyers', 'retirees'],
    painPoints: ['market_complexity', 'financing', 'property_management'],
    solutions: ['market_analysis', 'financing_options', 'management_services'],
    contentTypes: ['market_reports', 'investment_guides', 'property_tours'],
    marketingChannels: ['real_estate_platforms', 'investment_forums', 'local_ads']
  },

  // BELEZA & MODA
  {
    id: 'beauty_cosmetics',
    name: 'Beauty & Cosmetics',
    category: 'Beauty & Fashion',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'zh', 'ja', 'ko'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 20000,
    growthRate: 15,
    keywords: ['beauty', 'cosmetics', 'skincare', 'makeup'],
    culturalFactors: ['beauty_standards', 'self_expression'],
    seasonality: ['seasonal_trends', 'holiday_gifting'],
    targetAudience: ['women_18_45', 'beauty_enthusiasts', 'professionals'],
    painPoints: ['product_selection', 'skin_concerns', 'authenticity'],
    solutions: ['personalized_recommendations', 'quality_products', 'education'],
    contentTypes: ['tutorials', 'product_reviews', 'before_after'],
    marketingChannels: ['instagram', 'youtube', 'tiktok', 'beauty_blogs']
  },

  // ALIMENTAÇÃO & GASTRONOMIA
  {
    id: 'food_delivery',
    name: 'Food Delivery Services',
    category: 'Food & Beverage',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'de', 'zh', 'hi'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 30000,
    growthRate: 25,
    keywords: ['food_delivery', 'restaurant', 'takeout', 'convenience'],
    culturalFactors: ['convenience_culture', 'food_preferences'],
    seasonality: ['weather_dependent', 'holidays'],
    targetAudience: ['busy_professionals', 'families', 'students'],
    painPoints: ['delivery_time', 'food_quality', 'cost'],
    solutions: ['fast_delivery', 'quality_assurance', 'competitive_pricing'],
    contentTypes: ['menu_highlights', 'customer_reviews', 'delivery_updates'],
    marketingChannels: ['food_apps', 'social_media', 'local_advertising']
  },

  // PETS & ANIMAIS
  {
    id: 'pet_care',
    name: 'Pet Care & Services',
    category: 'Pets & Animals',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'de', 'fr'],
    marketSize: 'large',
    competitionLevel: 'medium',
    avgRevenue: 10000,
    growthRate: 20,
    keywords: ['pet_care', 'veterinary', 'pet_products', 'animal_health'],
    culturalFactors: ['pet_humanization', 'animal_welfare'],
    seasonality: ['year_round', 'holiday_boarding'],
    targetAudience: ['pet_owners', 'animal_lovers', 'families'],
    painPoints: ['pet_health', 'behavioral_issues', 'care_costs'],
    solutions: ['preventive_care', 'training', 'affordable_services'],
    contentTypes: ['care_tips', 'health_guides', 'success_stories'],
    marketingChannels: ['pet_communities', 'veterinary_clinics', 'social_media']
  },

  // VIAGENS & TURISMO
  {
    id: 'travel_tourism',
    name: 'Travel & Tourism',
    category: 'Travel & Hospitality',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'de', 'zh', 'ja'],
    marketSize: 'massive',
    competitionLevel: 'high',
    avgRevenue: 25000,
    growthRate: 30,
    keywords: ['travel', 'tourism', 'vacation', 'adventure'],
    culturalFactors: ['wanderlust', 'experience_economy'],
    seasonality: ['summer_peak', 'holiday_seasons'],
    targetAudience: ['travelers', 'adventure_seekers', 'families'],
    painPoints: ['planning_complexity', 'cost', 'safety_concerns'],
    solutions: ['easy_booking', 'competitive_prices', 'safety_assurance'],
    contentTypes: ['destination_guides', 'travel_vlogs', 'itineraries'],
    marketingChannels: ['travel_platforms', 'social_media', 'travel_blogs']
  },

  // JOGOS & ENTRETENIMENTO
  {
    id: 'gaming_esports',
    name: 'Gaming & Esports',
    category: 'Gaming & Entertainment',
    regions: ['Global'],
    languages: ['en', 'zh', 'ja', 'ko', 'es', 'pt'],
    marketSize: 'massive',
    competitionLevel: 'extreme',
    avgRevenue: 35000,
    growthRate: 40,
    keywords: ['gaming', 'esports', 'streaming', 'competitive_gaming'],
    culturalFactors: ['gaming_culture', 'competition'],
    seasonality: ['game_releases', 'tournament_seasons'],
    targetAudience: ['gamers', 'streamers', 'esports_fans'],
    painPoints: ['skill_improvement', 'equipment_costs', 'time_management'],
    solutions: ['coaching', 'equipment_deals', 'community'],
    contentTypes: ['gameplay_videos', 'tutorials', 'reviews'],
    marketingChannels: ['twitch', 'youtube', 'gaming_forums']
  },

  // SUSTENTABILIDADE & MEIO AMBIENTE
  {
    id: 'sustainable_living',
    name: 'Sustainable Living',
    category: 'Environment & Sustainability',
    regions: ['EU', 'US', 'AU', 'CA'],
    languages: ['en', 'de', 'fr', 'es'],
    marketSize: 'medium',
    competitionLevel: 'low',
    avgRevenue: 8000,
    growthRate: 35,
    keywords: ['sustainability', 'eco_friendly', 'green_living', 'climate_change'],
    culturalFactors: ['environmental_consciousness', 'future_generations'],
    seasonality: ['earth_day', 'climate_events'],
    targetAudience: ['environmentalists', 'conscious_consumers', 'millennials'],
    painPoints: ['cost_of_green_products', 'convenience', 'effectiveness'],
    solutions: ['affordable_alternatives', 'easy_swaps', 'education'],
    contentTypes: ['eco_tips', 'product_reviews', 'impact_stories'],
    marketingChannels: ['environmental_blogs', 'social_media', 'green_events']
  },

  // AGRICULTURA & AGRONEGÓCIO
  {
    id: 'agriculture_tech',
    name: 'Agriculture Technology',
    category: 'Agriculture & Farming',
    regions: ['US', 'BR', 'IN', 'AU', 'EU'],
    languages: ['en', 'pt', 'hi', 'es', 'de'],
    marketSize: 'large',
    competitionLevel: 'medium',
    avgRevenue: 40000,
    growthRate: 28,
    keywords: ['agtech', 'precision_farming', 'crop_monitoring', 'smart_agriculture'],
    culturalFactors: ['food_security', 'efficiency'],
    seasonality: ['planting_seasons', 'harvest_time'],
    targetAudience: ['farmers', 'agricultural_companies', 'cooperatives'],
    painPoints: ['yield_optimization', 'cost_management', 'weather_risks'],
    solutions: ['precision_tools', 'data_analytics', 'risk_management'],
    contentTypes: ['case_studies', 'yield_reports', 'technology_demos'],
    marketingChannels: ['agricultural_fairs', 'farming_publications', 'cooperatives']
  },

  // MANUFATURA & INDÚSTRIA
  {
    id: 'manufacturing_automation',
    name: 'Manufacturing Automation',
    category: 'Manufacturing & Industry',
    regions: ['DE', 'CN', 'US', 'JP', 'KR'],
    languages: ['en', 'de', 'zh', 'ja', 'ko'],
    marketSize: 'massive',
    competitionLevel: 'high',
    avgRevenue: 100000,
    growthRate: 22,
    keywords: ['automation', 'industry_4.0', 'robotics', 'manufacturing'],
    culturalFactors: ['efficiency', 'quality', 'innovation'],
    seasonality: ['budget_cycles', 'trade_shows'],
    targetAudience: ['manufacturers', 'plant_managers', 'engineers'],
    painPoints: ['labor_costs', 'quality_control', 'efficiency'],
    solutions: ['automated_systems', 'quality_assurance', 'cost_reduction'],
    contentTypes: ['case_studies', 'ROI_calculators', 'demos'],
    marketingChannels: ['trade_shows', 'industry_publications', 'linkedin']
  },

  // SERVIÇOS PROFISSIONAIS
  {
    id: 'legal_services',
    name: 'Legal Services',
    category: 'Professional Services',
    regions: ['US', 'EU', 'AU', 'CA', 'BR'],
    languages: ['en', 'es', 'pt', 'de', 'fr'],
    marketSize: 'large',
    competitionLevel: 'medium',
    avgRevenue: 30000,
    growthRate: 8,
    keywords: ['legal_services', 'law_firm', 'attorney', 'legal_advice'],
    culturalFactors: ['trust', 'expertise', 'confidentiality'],
    seasonality: ['tax_season', 'business_cycles'],
    targetAudience: ['businesses', 'individuals', 'startups'],
    painPoints: ['legal_complexity', 'high_costs', 'time_constraints'],
    solutions: ['expert_advice', 'cost_transparency', 'efficiency'],
    contentTypes: ['legal_guides', 'case_studies', 'consultations'],
    marketingChannels: ['legal_directories', 'referrals', 'content_marketing']
  },

  // SAÚDE MENTAL & BEM-ESTAR
  {
    id: 'mental_health',
    name: 'Mental Health & Wellness',
    category: 'Health & Wellness',
    regions: ['Global'],
    languages: ['en', 'es', 'pt', 'fr', 'de'],
    marketSize: 'large',
    competitionLevel: 'medium',
    avgRevenue: 15000,
    growthRate: 30,
    keywords: ['mental_health', 'therapy', 'wellness', 'mindfulness'],
    culturalFactors: ['mental_health_awareness', 'stigma_reduction'],
    seasonality: ['new_year', 'mental_health_awareness_months'],
    targetAudience: ['stressed_individuals', 'professionals', 'students'],
    painPoints: ['stress', 'anxiety', 'work_life_balance'],
    solutions: ['therapy', 'mindfulness_practices', 'stress_management'],
    contentTypes: ['wellness_tips', 'meditation_guides', 'success_stories'],
    marketingChannels: ['health_platforms', 'social_media', 'wellness_blogs']
  },

  // ENERGIA RENOVÁVEL
  {
    id: 'renewable_energy',
    name: 'Renewable Energy Solutions',
    category: 'Energy & Environment',
    regions: ['EU', 'US', 'AU', 'CN', 'IN'],
    languages: ['en', 'de', 'zh', 'hi', 'es'],
    marketSize: 'massive',
    competitionLevel: 'high',
    avgRevenue: 75000,
    growthRate: 45,
    keywords: ['solar_energy', 'wind_power', 'renewable_energy', 'sustainability'],
    culturalFactors: ['environmental_responsibility', 'energy_independence'],
    seasonality: ['government_incentives', 'weather_patterns'],
    targetAudience: ['homeowners', 'businesses', 'governments'],
    painPoints: ['high_initial_costs', 'complexity', 'ROI_uncertainty'],
    solutions: ['financing_options', 'expert_installation', 'guaranteed_savings'],
    contentTypes: ['savings_calculators', 'installation_guides', 'testimonials'],
    marketingChannels: ['green_energy_platforms', 'government_programs', 'referrals']
  }
];

// Função para buscar nichos por região
export const getNichesByRegion = (region: string): GlobalNiche[] => {
  return GLOBAL_NICHES.filter(niche => 
    niche.regions.includes(region) || niche.regions.includes('Global')
  );
};

// Função para buscar nichos por idioma
export const getNichesByLanguage = (language: string): GlobalNiche[] => {
  return GLOBAL_NICHES.filter(niche => niche.languages.includes(language));
};

// Função para buscar nichos por categoria
export const getNichesByCategory = (category: string): GlobalNiche[] => {
  return GLOBAL_NICHES.filter(niche => niche.category === category);
};

// Função para buscar nichos por tamanho de mercado
export const getNichesByMarketSize = (size: string): GlobalNiche[] => {
  return GLOBAL_NICHES.filter(niche => niche.marketSize === size);
};

// Função para obter nichos recomendados baseado em localização
export const getRecommendedNiches = (countryCode: string, language: string): GlobalNiche[] => {
  const regionNiches = getNichesByRegion(countryCode);
  const languageNiches = getNichesByLanguage(language);
  
  // Combinar e priorizar nichos que atendem ambos os critérios
  const combinedNiches = regionNiches.filter(niche => 
    languageNiches.some(langNiche => langNiche.id === niche.id)
  );
  
  // Ordenar por potencial de receita e crescimento
  return combinedNiches.sort((a, b) => 
    (b.avgRevenue * b.growthRate) - (a.avgRevenue * a.growthRate)
  ).slice(0, 20);
};

export default GLOBAL_NICHES;
