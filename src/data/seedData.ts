import { 
  ProductArea, 
  Domain, 
  Team, 
  OKR, 
  KeyResult, 
  CheckIn, 
  JiraLink,
  getConfidenceLabel 
} from '@/types';

// ============================================================================
// MARRIOTT DIGITAL — Full 30-Team Product Operating Model Demo
// ============================================================================
// 5 Product Areas → 10 Domains → 30 Teams
// Each team has a PM, 1-2 OKRs, key results, and check-in history
// Varied confidence trajectories: on-track, at-risk, recovering, declining
// ============================================================================

const currentQuarter = '2026-Q1';

// ======================== PRODUCT AREAS ========================

export const productAreas: ProductArea[] = [
  { id: 'pa-web', name: 'Marriott.com' },
  { id: 'pa-app', name: 'Bonvoy App' },
  { id: 'pa-guest', name: 'Guest Experience' },
  { id: 'pa-loyalty', name: 'Loyalty & Rewards' },
  { id: 'pa-payments', name: 'Payments & Revenue' },
];

// ======================== DOMAINS ========================

export const domains: Domain[] = [
  // Marriott.com
  { id: 'd-shop', name: 'Shopping & Browse', productAreaId: 'pa-web' },
  { id: 'd-booking', name: 'Booking Funnel', productAreaId: 'pa-web' },
  { id: 'd-content', name: 'Content & CMS', productAreaId: 'pa-web' },
  // Bonvoy App
  { id: 'd-core-app', name: 'Core App', productAreaId: 'pa-app' },
  { id: 'd-mobile-book', name: 'Mobile Booking', productAreaId: 'pa-app' },
  // Guest Experience
  { id: 'd-pre-stay', name: 'Pre-Stay', productAreaId: 'pa-guest' },
  { id: 'd-on-prop', name: 'On-Property', productAreaId: 'pa-guest' },
  // Loyalty & Rewards
  { id: 'd-bonvoy', name: 'Bonvoy Program', productAreaId: 'pa-loyalty' },
  { id: 'd-engage', name: 'Engagement', productAreaId: 'pa-loyalty' },
  // Payments & Revenue
  { id: 'd-pay', name: 'Payments', productAreaId: 'pa-payments' },
  { id: 'd-rev', name: 'Revenue Optimization', productAreaId: 'pa-payments' },
];

// ======================== TEAMS (30) ========================

export const teams: Team[] = [
  // Shopping & Browse (3)
  { id: 't-search', name: 'Search', domainId: 'd-shop', pmName: 'Sarah Chen', cadence: 'biweekly' },
  { id: 't-property', name: 'Property Detail', domainId: 'd-shop', pmName: 'James Whitfield', cadence: 'biweekly' },
  { id: 't-rates', name: 'Rates & Availability', domainId: 'd-shop', pmName: 'Priya Sharma', cadence: 'weekly' },

  // Booking Funnel (3)
  { id: 't-book-exp', name: 'Booking Experience', domainId: 'd-booking', pmName: 'Marcus Johnson', cadence: 'biweekly' },
  { id: 't-checkout', name: 'Checkout', domainId: 'd-booking', pmName: 'Emily Rodriguez', cadence: 'biweekly' },
  { id: 't-guest-info', name: 'Guest Info', domainId: 'd-booking', pmName: 'David Park', cadence: 'biweekly' },

  // Content & CMS (3)
  { id: 't-content-plat', name: 'Content Platform', domainId: 'd-content', pmName: 'Aisha Patel', cadence: 'biweekly' },
  { id: 't-personalize', name: 'Personalization', domainId: 'd-content', pmName: 'Tom Brennan', cadence: 'biweekly' },
  { id: 't-seo', name: 'SEO', domainId: 'd-content', pmName: 'Lisa Chang', cadence: 'weekly' },

  // Core App (3)
  { id: 't-home-nav', name: 'Home & Navigation', domainId: 'd-core-app', pmName: 'Rachel Kim', cadence: 'biweekly' },
  { id: 't-notifs', name: 'Notifications', domainId: 'd-core-app', pmName: 'Carlos Mendez', cadence: 'biweekly' },
  { id: 't-app-perf', name: 'App Performance', domainId: 'd-core-app', pmName: 'Nina Volkov', cadence: 'weekly' },

  // Mobile Booking (3)
  { id: 't-mob-search', name: 'Mobile Search', domainId: 'd-mobile-book', pmName: 'Kevin O\'Brien', cadence: 'biweekly' },
  { id: 't-mob-checkout', name: 'Mobile Checkout', domainId: 'd-mobile-book', pmName: 'Fatima Al-Hassan', cadence: 'biweekly' },
  { id: 't-mob-pay', name: 'Mobile Payments', domainId: 'd-mobile-book', pmName: 'Andre Thompson', cadence: 'biweekly' },

  // Pre-Stay (3)
  { id: 't-trip-plan', name: 'Trip Planning', domainId: 'd-pre-stay', pmName: 'Megan Foster', cadence: 'biweekly' },
  { id: 't-room-select', name: 'Room Selection', domainId: 'd-pre-stay', pmName: 'Ryan Nakamura', cadence: 'biweekly' },
  { id: 't-digital-key', name: 'Digital Key', domainId: 'd-pre-stay', pmName: 'Sofia Gutierrez', cadence: 'weekly' },

  // On-Property (3)
  { id: 't-chat', name: 'Chat & Requests', domainId: 'd-on-prop', pmName: 'Daniel Wright', cadence: 'biweekly' },
  { id: 't-fnb', name: 'F&B Ordering', domainId: 'd-on-prop', pmName: 'Hannah Lee', cadence: 'biweekly' },
  { id: 't-room-ctrl', name: 'Room Controls', domainId: 'd-on-prop', pmName: 'Omar Farah', cadence: 'biweekly' },

  // Bonvoy Program (3)
  { id: 't-points', name: 'Points & Earn', domainId: 'd-bonvoy', pmName: 'Jessica Taylor', cadence: 'biweekly' },
  { id: 't-redeem', name: 'Redemption', domainId: 'd-bonvoy', pmName: 'Michael Santos', cadence: 'biweekly' },
  { id: 't-elite', name: 'Elite Status', domainId: 'd-bonvoy', pmName: 'Lauren Mitchell', cadence: 'biweekly' },

  // Engagement (3)
  { id: 't-offers', name: 'Offers & Promotions', domainId: 'd-engage', pmName: 'Brandon Cooper', cadence: 'biweekly' },
  { id: 't-partners', name: 'Partnerships', domainId: 'd-engage', pmName: 'Yuki Tanaka', cadence: 'biweekly' },
  { id: 't-member-comms', name: 'Member Comms', domainId: 'd-engage', pmName: 'Claire Dubois', cadence: 'weekly' },

  // Payments (3)
  { id: 't-pay-proc', name: 'Payment Processing', domainId: 'd-pay', pmName: 'Alex Rivera', cadence: 'biweekly' },
  { id: 't-fraud', name: 'Fraud & Risk', domainId: 'd-pay', pmName: 'Natalie Okonkwo', cadence: 'weekly' },
  { id: 't-billing', name: 'Billing', domainId: 'd-pay', pmName: 'Chris Larsen', cadence: 'biweekly' },

  // Revenue Optimization (3)
  { id: 't-rate-strat', name: 'Rate Strategy', domainId: 'd-rev', pmName: 'Diana Petrova', cadence: 'biweekly' },
  { id: 't-distrib', name: 'Distribution', domainId: 'd-rev', pmName: 'Eric Sandoval', cadence: 'biweekly' },
  { id: 't-direct', name: 'Direct Channel', domainId: 'd-rev', pmName: 'Samantha Kwon', cadence: 'biweekly' },
];

// ======================== DOMAIN OKRs ========================

export const okrs: OKR[] = [
  // Domain-level OKRs (one per domain)
  { id: 'okr-d-shop', level: 'domain', ownerId: 'd-shop', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Make it effortless to find and compare the right property' },
  { id: 'okr-d-booking', level: 'domain', ownerId: 'd-booking', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase direct booking conversion across all channels' },
  { id: 'okr-d-content', level: 'domain', ownerId: 'd-content', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Deliver personalized, high-performing content at scale' },
  { id: 'okr-d-core-app', level: 'domain', ownerId: 'd-core-app', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Build a best-in-class app foundation for Bonvoy members' },
  { id: 'okr-d-mobile-book', level: 'domain', ownerId: 'd-mobile-book', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Close the mobile booking conversion gap with desktop' },
  { id: 'okr-d-pre-stay', level: 'domain', ownerId: 'd-pre-stay', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Elevate the pre-arrival experience to drive loyalty' },
  { id: 'okr-d-on-prop', level: 'domain', ownerId: 'd-on-prop', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Digitize on-property services to improve guest satisfaction' },
  { id: 'okr-d-bonvoy', level: 'domain', ownerId: 'd-bonvoy', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase member engagement with points and rewards' },
  { id: 'okr-d-engage', level: 'domain', ownerId: 'd-engage', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Drive incremental bookings through targeted engagement' },
  { id: 'okr-d-pay', level: 'domain', ownerId: 'd-pay', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Reduce payment friction and protect revenue' },
  { id: 'okr-d-rev', level: 'domain', ownerId: 'd-rev', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Maximize direct channel revenue contribution' },

  // ======================== TEAM OKRs (30 teams × 1-2 each) ========================

  // --- Shopping & Browse ---
  // Search — ON TRACK
  { id: 'okr-search', level: 'team', ownerId: 't-search', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Improve search relevance and speed', parentOkrId: 'okr-d-shop' },
  // Property Detail — RECOVERING
  { id: 'okr-property', level: 'team', ownerId: 't-property', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase property page engagement and click-through to booking', parentOkrId: 'okr-d-shop' },
  // Rates & Availability — ON TRACK
  { id: 'okr-rates', level: 'team', ownerId: 't-rates', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Ensure real-time rate accuracy across all inventory sources', parentOkrId: 'okr-d-shop' },

  // --- Booking Funnel ---
  // Booking Experience — RECOVERING
  { id: 'okr-book-exp', level: 'team', ownerId: 't-book-exp', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Improve booking conversion rate', parentOkrId: 'okr-d-booking' },
  // Checkout — AT RISK
  { id: 'okr-checkout', level: 'team', ownerId: 't-checkout', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Reduce checkout abandonment rate', parentOkrId: 'okr-d-booking' },
  // Guest Info — ON TRACK
  { id: 'okr-guest-info', level: 'team', ownerId: 't-guest-info', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Streamline guest information capture to reduce form friction', parentOkrId: 'okr-d-booking' },

  // --- Content & CMS ---
  // Content Platform — ON TRACK
  { id: 'okr-content-plat', level: 'team', ownerId: 't-content-plat', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Migrate 80% of static pages to headless CMS', parentOkrId: 'okr-d-content' },
  // Personalization — RECOVERING
  { id: 'okr-personalize', level: 'team', ownerId: 't-personalize', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase personalized content engagement by 25%', parentOkrId: 'okr-d-content' },
  // SEO — ON TRACK
  { id: 'okr-seo', level: 'team', ownerId: 't-seo', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Grow organic traffic to destination pages by 15%', parentOkrId: 'okr-d-content' },

  // --- Core App ---
  // Home & Navigation — ON TRACK
  { id: 'okr-home-nav', level: 'team', ownerId: 't-home-nav', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Redesign app home to increase feature discovery', parentOkrId: 'okr-d-core-app' },
  // Notifications — AT RISK
  { id: 'okr-notifs', level: 'team', ownerId: 't-notifs', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase push notification opt-in and engagement', parentOkrId: 'okr-d-core-app' },
  // App Performance — ON TRACK
  { id: 'okr-app-perf', level: 'team', ownerId: 't-app-perf', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Reduce app crash rate and improve cold start time', parentOkrId: 'okr-d-core-app' },

  // --- Mobile Booking ---
  // Mobile Search — ON TRACK
  { id: 'okr-mob-search', level: 'team', ownerId: 't-mob-search', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Optimize mobile search UX for thumb-friendly interaction', parentOkrId: 'okr-d-mobile-book' },
  // Mobile Checkout — AT RISK
  { id: 'okr-mob-checkout', level: 'team', ownerId: 't-mob-checkout', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Reduce mobile checkout drop-off by 30%', parentOkrId: 'okr-d-mobile-book' },
  // Mobile Payments — DECLINING
  { id: 'okr-mob-pay', level: 'team', ownerId: 't-mob-pay', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Launch Apple Pay and Google Pay for mobile bookings', parentOkrId: 'okr-d-mobile-book' },

  // --- Pre-Stay ---
  // Trip Planning — ON TRACK
  { id: 'okr-trip-plan', level: 'team', ownerId: 't-trip-plan', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Launch trip itinerary feature with 20% adoption', parentOkrId: 'okr-d-pre-stay' },
  // Room Selection — RECOVERING
  { id: 'okr-room-select', level: 'team', ownerId: 't-room-select', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase room upgrade upsell conversion by 40%', parentOkrId: 'okr-d-pre-stay' },
  // Digital Key — ON TRACK
  { id: 'okr-digital-key', level: 'team', ownerId: 't-digital-key', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Expand digital key to 2,000 additional properties', parentOkrId: 'okr-d-pre-stay' },

  // --- On-Property ---
  // Chat & Requests — RECOVERING
  { id: 'okr-chat', level: 'team', ownerId: 't-chat', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase in-app service request adoption by 50%', parentOkrId: 'okr-d-on-prop' },
  // F&B Ordering — AT RISK
  { id: 'okr-fnb', level: 'team', ownerId: 't-fnb', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Launch mobile F&B ordering at 500 properties', parentOkrId: 'okr-d-on-prop' },
  // Room Controls — ON TRACK
  { id: 'okr-room-ctrl', level: 'team', ownerId: 't-room-ctrl', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Integrate smart room controls in 300 premium properties', parentOkrId: 'okr-d-on-prop' },

  // --- Bonvoy Program ---
  // Points & Earn — ON TRACK
  { id: 'okr-points', level: 'team', ownerId: 't-points', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase points earning transparency and member satisfaction', parentOkrId: 'okr-d-bonvoy' },
  // Redemption — DECLINING
  { id: 'okr-redeem', level: 'team', ownerId: 't-redeem', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Simplify redemption flow and reduce points breakage', parentOkrId: 'okr-d-bonvoy' },
  // Elite Status — ON TRACK
  { id: 'okr-elite', level: 'team', ownerId: 't-elite', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Launch dynamic elite benefits dashboard', parentOkrId: 'okr-d-bonvoy' },

  // --- Engagement ---
  // Offers & Promotions — ON TRACK
  { id: 'okr-offers', level: 'team', ownerId: 't-offers', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase offer redemption rate by 20%', parentOkrId: 'okr-d-engage' },
  // Partnerships — RECOVERING
  { id: 'okr-partners', level: 'team', ownerId: 't-partners', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Launch 5 new earn/burn partnerships', parentOkrId: 'okr-d-engage' },
  // Member Comms — ON TRACK
  { id: 'okr-member-comms', level: 'team', ownerId: 't-member-comms', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Improve email engagement through segmentation', parentOkrId: 'okr-d-engage' },

  // --- Payments ---
  // Payment Processing — AT RISK
  { id: 'okr-pay-proc', level: 'team', ownerId: 't-pay-proc', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Reduce payment failure rate from 4.5% to 2.5%', parentOkrId: 'okr-d-pay' },
  // Fraud & Risk — ON TRACK
  { id: 'okr-fraud', level: 'team', ownerId: 't-fraud', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Reduce false-positive fraud declines by 30%', parentOkrId: 'okr-d-pay' },
  // Billing — ON TRACK
  { id: 'okr-billing', level: 'team', ownerId: 't-billing', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Automate 90% of billing dispute resolution', parentOkrId: 'okr-d-pay' },

  // --- Revenue Optimization ---
  // Rate Strategy — RECOVERING
  { id: 'okr-rate-strat', level: 'team', ownerId: 't-rate-strat', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Improve dynamic pricing accuracy by 15%', parentOkrId: 'okr-d-rev' },
  // Distribution — ON TRACK
  { id: 'okr-distrib', level: 'team', ownerId: 't-distrib', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Increase direct channel share from 32% to 38%', parentOkrId: 'okr-d-rev' },
  // Direct Channel — AT RISK
  { id: 'okr-direct', level: 'team', ownerId: 't-direct', quarter: currentQuarter, year: 2026, quarterNum: 'Q1', objectiveText: 'Grow Best Rate Guarantee conversions by 25%', parentOkrId: 'okr-d-rev' },
];

// ======================== KEY RESULTS ========================

export const keyResults: KeyResult[] = [
  // --- Domain KRs ---
  { id: 'kr-d-shop-1', okrId: 'okr-d-shop', text: 'Improve search-to-detail click-through rate from 35% to 45%', targetValue: 45, currentValue: 42.1 },
  { id: 'kr-d-booking-1', okrId: 'okr-d-booking', text: 'Increase booking conversion from 18% to 22%', targetValue: 22, currentValue: 19.4 },
  { id: 'kr-d-content-1', okrId: 'okr-d-content', text: 'Increase content engagement score from 55 to 70', targetValue: 70, currentValue: 64 },
  { id: 'kr-d-core-app-1', okrId: 'okr-d-core-app', text: 'Achieve 4.7+ app store rating', targetValue: 4.7, currentValue: 4.5 },
  { id: 'kr-d-mobile-book-1', okrId: 'okr-d-mobile-book', text: 'Close mobile-desktop conversion gap from 8pp to 4pp', targetValue: 4, currentValue: 6.1 },
  { id: 'kr-d-pre-stay-1', okrId: 'okr-d-pre-stay', text: 'Increase pre-stay digital touchpoint engagement by 30%', targetValue: 30, currentValue: 24 },
  { id: 'kr-d-on-prop-1', okrId: 'okr-d-on-prop', text: 'Increase digital service adoption from 15% to 30%', targetValue: 30, currentValue: 21 },
  { id: 'kr-d-bonvoy-1', okrId: 'okr-d-bonvoy', text: 'Increase monthly active loyalty members by 12%', targetValue: 12, currentValue: 8.5 },
  { id: 'kr-d-engage-1', okrId: 'okr-d-engage', text: 'Drive $45M incremental bookings through engagement', targetValue: 45, currentValue: 31 },
  { id: 'kr-d-pay-1', okrId: 'okr-d-pay', text: 'Reduce payment-related revenue leakage by $8M', targetValue: 8, currentValue: 4.2 },
  { id: 'kr-d-rev-1', okrId: 'okr-d-rev', text: 'Increase direct channel revenue contribution by 6pp', targetValue: 6, currentValue: 3.8 },

  // --- Search (ON TRACK) ---
  { id: 'kr-search-1', okrId: 'okr-search', text: 'Reduce average search latency from 1.2s to 0.6s', targetValue: 0.6, currentValue: 0.72 },
  { id: 'kr-search-2', okrId: 'okr-search', text: 'Increase search result relevance score from 72 to 85', targetValue: 85, currentValue: 82 },

  // --- Property Detail (RECOVERING) ---
  { id: 'kr-property-1', okrId: 'okr-property', text: 'Increase photo gallery engagement by 35%', targetValue: 35, currentValue: 24 },
  { id: 'kr-property-2', okrId: 'okr-property', text: 'Improve detail-to-booking CTR from 12% to 18%', targetValue: 18, currentValue: 15.2, needsAttention: true, attentionReason: 'Map integration delayed; working on fallback' },

  // --- Rates & Availability (ON TRACK) ---
  { id: 'kr-rates-1', okrId: 'okr-rates', text: 'Reduce rate discrepancy incidents from 120/week to 30/week', targetValue: 30, currentValue: 42 },
  { id: 'kr-rates-2', okrId: 'okr-rates', text: 'Improve rate load time from 2.1s to 0.8s', targetValue: 0.8, currentValue: 0.95 },

  // --- Booking Experience (RECOVERING) ---
  { id: 'kr-book-exp-1', okrId: 'okr-book-exp', text: 'Increase completed bookings from 18% to 22%', targetValue: 22, currentValue: 19.8 },
  { id: 'kr-book-exp-2', okrId: 'okr-book-exp', text: 'Reduce checkout abandonment from 30% to 20%', targetValue: 20, currentValue: 24, needsAttention: true, attentionReason: 'Mobile checkout still underperforming; investigating payment step friction' },

  // --- Checkout (AT RISK) ---
  { id: 'kr-checkout-1', okrId: 'okr-checkout', text: 'Reduce average checkout time from 4.2min to 2.5min', targetValue: 2.5, currentValue: 3.6, needsAttention: true, attentionReason: 'PCI compliance changes require additional form steps' },
  { id: 'kr-checkout-2', okrId: 'okr-checkout', text: 'Increase one-page checkout adoption to 60%', targetValue: 60, currentValue: 35, needsAttention: true, attentionReason: 'UX redesign delayed by accessibility audit findings' },

  // --- Guest Info (ON TRACK) ---
  { id: 'kr-guest-info-1', okrId: 'okr-guest-info', text: 'Reduce form fields from 14 to 8 for returning guests', targetValue: 8, currentValue: 9 },
  { id: 'kr-guest-info-2', okrId: 'okr-guest-info', text: 'Increase autofill accuracy from 70% to 92%', targetValue: 92, currentValue: 88 },

  // --- Content Platform (ON TRACK) ---
  { id: 'kr-content-plat-1', okrId: 'okr-content-plat', text: 'Migrate 80% of pages to headless CMS', targetValue: 80, currentValue: 68 },
  { id: 'kr-content-plat-2', okrId: 'okr-content-plat', text: 'Reduce content publish time from 4hrs to 30min', targetValue: 30, currentValue: 45 },

  // --- Personalization (RECOVERING) ---
  { id: 'kr-personalize-1', okrId: 'okr-personalize', text: 'Increase personalized content CTR by 25%', targetValue: 25, currentValue: 16 },
  { id: 'kr-personalize-2', okrId: 'okr-personalize', text: 'Deploy ML recommendation engine to 100% of logged-in users', targetValue: 100, currentValue: 72, needsAttention: true, attentionReason: 'ML model retraining needed after data pipeline changes' },

  // --- SEO (ON TRACK) ---
  { id: 'kr-seo-1', okrId: 'okr-seo', text: 'Grow organic sessions to destination pages by 15%', targetValue: 15, currentValue: 12.5 },
  { id: 'kr-seo-2', okrId: 'okr-seo', text: 'Increase page 1 rankings for 50 target keywords', targetValue: 50, currentValue: 41 },

  // --- Home & Navigation (ON TRACK) ---
  { id: 'kr-home-nav-1', okrId: 'okr-home-nav', text: 'Increase feature discovery rate from 23% to 40%', targetValue: 40, currentValue: 36 },
  { id: 'kr-home-nav-2', okrId: 'okr-home-nav', text: 'Reduce navigation depth to key actions by 1 tap', targetValue: 1, currentValue: 1.3 },

  // --- Notifications (AT RISK) ---
  { id: 'kr-notifs-1', okrId: 'okr-notifs', text: 'Increase push opt-in from 38% to 55%', targetValue: 55, currentValue: 41, needsAttention: true, attentionReason: 'iOS 19 permission changes impacting opt-in rates' },
  { id: 'kr-notifs-2', okrId: 'okr-notifs', text: 'Increase notification-driven booking rate by 20%', targetValue: 20, currentValue: 8, needsAttention: true, attentionReason: 'Personalization engine not yet connected to push system' },

  // --- App Performance (ON TRACK) ---
  { id: 'kr-app-perf-1', okrId: 'okr-app-perf', text: 'Reduce crash rate from 1.2% to 0.3%', targetValue: 0.3, currentValue: 0.45 },
  { id: 'kr-app-perf-2', okrId: 'okr-app-perf', text: 'Reduce cold start time from 3.8s to 2.0s', targetValue: 2.0, currentValue: 2.3 },

  // --- Mobile Search (ON TRACK) ---
  { id: 'kr-mob-search-1', okrId: 'okr-mob-search', text: 'Increase mobile search completion rate from 62% to 78%', targetValue: 78, currentValue: 73 },
  { id: 'kr-mob-search-2', okrId: 'okr-mob-search', text: 'Launch voice search with 10% adoption', targetValue: 10, currentValue: 7.2 },

  // --- Mobile Checkout (AT RISK) ---
  { id: 'kr-mob-checkout-1', okrId: 'okr-mob-checkout', text: 'Reduce mobile checkout drop-off from 45% to 30%', targetValue: 30, currentValue: 40, needsAttention: true, attentionReason: 'Payment tokenization causing timeouts on older devices' },
  { id: 'kr-mob-checkout-2', okrId: 'okr-mob-checkout', text: 'Achieve 3-tap checkout for returning guests', targetValue: 3, currentValue: 5 },

  // --- Mobile Payments (DECLINING) ---
  { id: 'kr-mob-pay-1', okrId: 'okr-mob-pay', text: 'Launch Apple Pay in US market by end of Q1', targetValue: 100, currentValue: 45, needsAttention: true, attentionReason: 'Apple certification delayed; revised timeline is mid-Q2' },
  { id: 'kr-mob-pay-2', okrId: 'okr-mob-pay', text: 'Launch Google Pay in US market by end of Q1', targetValue: 100, currentValue: 30, needsAttention: true, attentionReason: 'Blocked on Apple Pay integration; shared payment SDK' },

  // --- Trip Planning (ON TRACK) ---
  { id: 'kr-trip-plan-1', okrId: 'okr-trip-plan', text: 'Launch trip itinerary MVP with 20% adoption', targetValue: 20, currentValue: 16 },
  { id: 'kr-trip-plan-2', okrId: 'okr-trip-plan', text: 'Achieve 4.2+ user satisfaction score', targetValue: 4.2, currentValue: 4.1 },

  // --- Room Selection (RECOVERING) ---
  { id: 'kr-room-select-1', okrId: 'okr-room-select', text: 'Increase room upgrade conversion from 8% to 12%', targetValue: 12, currentValue: 9.8 },
  { id: 'kr-room-select-2', okrId: 'okr-room-select', text: 'Launch visual room comparison tool', targetValue: 100, currentValue: 65, needsAttention: true, attentionReason: 'Photography assets behind schedule for 30% of properties' },

  // --- Digital Key (ON TRACK) ---
  { id: 'kr-digital-key-1', okrId: 'okr-digital-key', text: 'Expand to 2,000 additional properties', targetValue: 2000, currentValue: 1650 },
  { id: 'kr-digital-key-2', okrId: 'okr-digital-key', text: 'Achieve 95% unlock success rate', targetValue: 95, currentValue: 93 },

  // --- Chat & Requests (RECOVERING) ---
  { id: 'kr-chat-1', okrId: 'okr-chat', text: 'Increase in-app request adoption from 8% to 15%', targetValue: 15, currentValue: 11.5 },
  { id: 'kr-chat-2', okrId: 'okr-chat', text: 'Reduce average response time from 12min to 5min', targetValue: 5, currentValue: 7.2, needsAttention: true, attentionReason: 'Staff training rollout 60% complete; targeting full coverage by week 10' },

  // --- F&B Ordering (AT RISK) ---
  { id: 'kr-fnb-1', okrId: 'okr-fnb', text: 'Launch mobile ordering at 500 properties', targetValue: 500, currentValue: 180, needsAttention: true, attentionReason: 'POS integration issues at franchise properties; pivot to cloud POS' },
  { id: 'kr-fnb-2', okrId: 'okr-fnb', text: 'Achieve $12 average order value', targetValue: 12, currentValue: 9.5 },

  // --- Room Controls (ON TRACK) ---
  { id: 'kr-room-ctrl-1', okrId: 'okr-room-ctrl', text: 'Deploy smart controls in 300 premium properties', targetValue: 300, currentValue: 240 },
  { id: 'kr-room-ctrl-2', okrId: 'okr-room-ctrl', text: 'Achieve 65% guest usage rate', targetValue: 65, currentValue: 58 },

  // --- Points & Earn (ON TRACK) ---
  { id: 'kr-points-1', okrId: 'okr-points', text: 'Launch real-time points tracker with 40% adoption', targetValue: 40, currentValue: 34 },
  { id: 'kr-points-2', okrId: 'okr-points', text: 'Increase member satisfaction with earnings clarity from 62 to 80', targetValue: 80, currentValue: 74 },

  // --- Redemption (DECLINING) ---
  { id: 'kr-redeem-1', okrId: 'okr-redeem', text: 'Reduce redemption flow steps from 7 to 3', targetValue: 3, currentValue: 5, needsAttention: true, attentionReason: 'Legal review required new disclosure steps; negotiating placement' },
  { id: 'kr-redeem-2', okrId: 'okr-redeem', text: 'Reduce points breakage from 22% to 15%', targetValue: 15, currentValue: 20, needsAttention: true, attentionReason: 'Expiration policy changes stuck in legal approval' },

  // --- Elite Status (ON TRACK) ---
  { id: 'kr-elite-1', okrId: 'okr-elite', text: 'Launch dynamic benefits dashboard', targetValue: 100, currentValue: 82 },
  { id: 'kr-elite-2', okrId: 'okr-elite', text: 'Increase elite member engagement with benefits by 30%', targetValue: 30, currentValue: 24 },

  // --- Offers & Promotions (ON TRACK) ---
  { id: 'kr-offers-1', okrId: 'okr-offers', text: 'Increase offer redemption rate from 5% to 7%', targetValue: 7, currentValue: 6.4 },
  { id: 'kr-offers-2', okrId: 'okr-offers', text: 'Launch AI-powered offer targeting', targetValue: 100, currentValue: 78 },

  // --- Partnerships (RECOVERING) ---
  { id: 'kr-partners-1', okrId: 'okr-partners', text: 'Launch 5 new earn/burn partnerships', targetValue: 5, currentValue: 3 },
  { id: 'kr-partners-2', okrId: 'okr-partners', text: 'Drive $8M incremental revenue through partnerships', targetValue: 8, currentValue: 4.5, needsAttention: true, attentionReason: 'Airline partnership delayed by codeshare renegotiation' },

  // --- Member Comms (ON TRACK) ---
  { id: 'kr-member-comms-1', okrId: 'okr-member-comms', text: 'Increase email open rate from 18% to 28%', targetValue: 28, currentValue: 25 },
  { id: 'kr-member-comms-2', okrId: 'okr-member-comms', text: 'Deploy 12 new audience segments', targetValue: 12, currentValue: 10 },

  // --- Payment Processing (AT RISK) ---
  { id: 'kr-pay-proc-1', okrId: 'okr-pay-proc', text: 'Reduce payment error rate from 4.5% to 2.5%', targetValue: 2.5, currentValue: 3.8, needsAttention: true, attentionReason: 'Gateway v2.3 rollout delayed; vendor escalation ongoing' },
  { id: 'kr-pay-proc-2', okrId: 'okr-pay-proc', text: 'Increase retry success from 40% to 65%', targetValue: 65, currentValue: 48, needsAttention: true, attentionReason: 'Blocked on gateway stability before retry logic deployment' },

  // --- Fraud & Risk (ON TRACK) ---
  { id: 'kr-fraud-1', okrId: 'okr-fraud', text: 'Reduce false-positive decline rate from 3.2% to 2.2%', targetValue: 2.2, currentValue: 2.5 },
  { id: 'kr-fraud-2', okrId: 'okr-fraud', text: 'Deploy ML fraud model v3 across all markets', targetValue: 100, currentValue: 85 },

  // --- Billing (ON TRACK) ---
  { id: 'kr-billing-1', okrId: 'okr-billing', text: 'Automate 90% of billing disputes', targetValue: 90, currentValue: 78 },
  { id: 'kr-billing-2', okrId: 'okr-billing', text: 'Reduce dispute resolution time from 14 days to 5 days', targetValue: 5, currentValue: 7 },

  // --- Rate Strategy (RECOVERING) ---
  { id: 'kr-rate-strat-1', okrId: 'okr-rate-strat', text: 'Improve dynamic pricing accuracy from 78% to 93%', targetValue: 93, currentValue: 85 },
  { id: 'kr-rate-strat-2', okrId: 'okr-rate-strat', text: 'Reduce rate parity violations by 40%', targetValue: 40, currentValue: 28, needsAttention: true, attentionReason: 'OTA contract renegotiations in progress' },

  // --- Distribution (ON TRACK) ---
  { id: 'kr-distrib-1', okrId: 'okr-distrib', text: 'Increase direct channel share from 32% to 38%', targetValue: 38, currentValue: 35.5 },
  { id: 'kr-distrib-2', okrId: 'okr-distrib', text: 'Reduce OTA commission costs by $12M', targetValue: 12, currentValue: 8.5 },

  // --- Direct Channel (AT RISK) ---
  { id: 'kr-direct-1', okrId: 'okr-direct', text: 'Grow Best Rate Guarantee conversions by 25%', targetValue: 25, currentValue: 12, needsAttention: true, attentionReason: 'Competitor rate matching making BRG less compelling' },
  { id: 'kr-direct-2', okrId: 'okr-direct', text: 'Increase member-only rate adoption by 30%', targetValue: 30, currentValue: 18, needsAttention: true, attentionReason: 'Cannibalization concerns from revenue management team' },
];

// ======================== CHECK-INS ========================
// 4 check-in cycles: Jan 13, Jan 27, Feb 10, Feb 24
// Each team has varied confidence trajectories

function ci(id: string, okrId: string, date: string, progress: number, confidence: number, reason: string, note?: string): CheckIn {
  return {
    id, okrId, date, cadence: 'biweekly', progress, confidence,
    confidenceLabel: getConfidenceLabel(confidence),
    reasonForChange: reason,
    optionalNote: note,
  };
}

export const checkIns: CheckIn[] = [
  // ========== SEARCH (ON TRACK: 78→80→82→85) ==========
  ci('ci-search-1', 'okr-search', '2026-01-13', 12, 78, 'New search index deployed; early latency improvements.'),
  ci('ci-search-2', 'okr-search', '2026-01-27', 30, 80, 'Relevance model v2 showing 8% improvement in A/B test.'),
  ci('ci-search-3', 'okr-search', '2026-02-10', 55, 82, 'Autocomplete and filters shipped. User engagement up.'),
  ci('ci-search-4', 'okr-search', '2026-02-24', 72, 85, 'On pace to hit both KRs. Latency now at 0.72s.'),

  // ========== PROPERTY DETAIL (RECOVERING: 70→58→62→68) ==========
  ci('ci-property-1', 'okr-property', '2026-01-13', 10, 70, 'Photo gallery redesign kicked off; baseline metrics captured.'),
  ci('ci-property-2', 'okr-property', '2026-01-27', 22, 58, 'Map integration vendor issues; gallery A/B test inconclusive.', 'Map vendor SDK breaking on iOS. Evaluating alternatives.'),
  ci('ci-property-3', 'okr-property', '2026-02-10', 38, 62, 'Switched map provider. Gallery v2 showing 18% engagement lift.'),
  ci('ci-property-4', 'okr-property', '2026-02-24', 52, 68, 'Recovery on track. CTR improving but below target pace.'),

  // ========== RATES & AVAILABILITY (ON TRACK: 75→78→80→82) ==========
  ci('ci-rates-1', 'okr-rates', '2026-01-13', 15, 75, 'Rate sync pipeline optimized; discrepancies down 25%.'),
  ci('ci-rates-2', 'okr-rates', '2026-01-27', 35, 78, 'Caching layer deployed. Rate load time at 1.1s.'),
  ci('ci-rates-3', 'okr-rates', '2026-02-10', 58, 80, 'Real-time inventory feed live for top 500 properties.'),
  ci('ci-rates-4', 'okr-rates', '2026-02-24', 74, 82, 'Discrepancy incidents down to 42/week. Strong trajectory.'),

  // ========== BOOKING EXPERIENCE (RECOVERING: 75→68→60→65) ==========
  ci('ci-book-exp-1', 'okr-book-exp', '2026-01-13', 10, 75, 'Guest checkout simplification A/B launched. Early signals positive.'),
  ci('ci-book-exp-2', 'okr-book-exp', '2026-01-27', 28, 68, 'Mobile conversion lagging; investigating payment step drop-off.'),
  ci('ci-book-exp-3', 'okr-book-exp', '2026-02-10', 42, 60, 'Mobile experiments underperformed. Payment retry modal causing friction.'),
  ci('ci-book-exp-4', 'okr-book-exp', '2026-02-24', 55, 65, 'Removed retry modal. Desktop +1.8pp. Mobile stabilizing.'),

  // ========== CHECKOUT (AT RISK: 60→50→42→38) ==========
  ci('ci-checkout-1', 'okr-checkout', '2026-01-13', 8, 60, 'One-page checkout prototype in dev. PCI review started.'),
  ci('ci-checkout-2', 'okr-checkout', '2026-01-27', 18, 50, 'PCI compliance requires additional fields. Redesigning.', 'Compliance team mandating 3DS2 inline, adding steps.'),
  ci('ci-checkout-3', 'okr-checkout', '2026-02-10', 28, 42, 'Accessibility audit flagged 12 issues. Fixing before launch.'),
  ci('ci-checkout-4', 'okr-checkout', '2026-02-24', 35, 38, 'Adoption stuck at 35%. Need exec decision on compliance tradeoffs.'),

  // ========== GUEST INFO (ON TRACK: 72→75→78→80) ==========
  ci('ci-guest-info-1', 'okr-guest-info', '2026-01-13', 15, 72, 'Field reduction analysis complete. Autofill API integrated.'),
  ci('ci-guest-info-2', 'okr-guest-info', '2026-01-27', 35, 75, 'Returning guest flow now 9 fields. Autofill at 82%.'),
  ci('ci-guest-info-3', 'okr-guest-info', '2026-02-10', 58, 78, 'Autofill accuracy climbing with address API improvements.'),
  ci('ci-guest-info-4', 'okr-guest-info', '2026-02-24', 72, 80, 'On pace. Autofill at 88%, targeting 92% by end of quarter.'),

  // ========== CONTENT PLATFORM (ON TRACK: 70→74→78→80) ==========
  ci('ci-content-plat-1', 'okr-content-plat', '2026-01-13', 10, 70, 'Migration tooling built. First 200 pages migrated.'),
  ci('ci-content-plat-2', 'okr-content-plat', '2026-01-27', 30, 74, 'Batch migration running smoothly. 400 pages done.'),
  ci('ci-content-plat-3', 'okr-content-plat', '2026-02-10', 55, 78, '68% migrated. Content editors onboarding to new CMS.'),
  ci('ci-content-plat-4', 'okr-content-plat', '2026-02-24', 70, 80, 'Publish time down to 45min. Confident we hit 80% target.'),

  // ========== PERSONALIZATION (RECOVERING: 72→55→60→65) ==========
  ci('ci-personalize-1', 'okr-personalize', '2026-01-13', 10, 72, 'ML model initial training complete. A/B framework set up.'),
  ci('ci-personalize-2', 'okr-personalize', '2026-01-27', 22, 55, 'Data pipeline broke. Model accuracy dropped. Retraining needed.', 'ETL job failure corrupted 2 weeks of behavioral data.'),
  ci('ci-personalize-3', 'okr-personalize', '2026-02-10', 38, 60, 'Pipeline fixed. Model v2 in training. Manual segments filling gap.'),
  ci('ci-personalize-4', 'okr-personalize', '2026-02-24', 50, 65, 'Model v2 deployed to 72% of users. CTR up 16% vs 25% target.'),

  // ========== SEO (ON TRACK: 76→78→80→82) ==========
  ci('ci-seo-1', 'okr-seo', '2026-01-13', 12, 76, 'Technical SEO audit complete. Schema markup deployed.'),
  ci('ci-seo-2', 'okr-seo', '2026-01-27', 32, 78, 'Destination pages optimized. Organic sessions up 7%.'),
  ci('ci-seo-3', 'okr-seo', '2026-02-10', 55, 80, '41 keywords on page 1. Content velocity increasing.'),
  ci('ci-seo-4', 'okr-seo', '2026-02-24', 70, 82, 'Organic traffic at +12.5%. On pace for 15% target.'),

  // ========== HOME & NAVIGATION (ON TRACK: 74→76→78→80) ==========
  ci('ci-home-nav-1', 'okr-home-nav', '2026-01-13', 10, 74, 'New home screen wireframes approved. Dev sprint started.'),
  ci('ci-home-nav-2', 'okr-home-nav', '2026-01-27', 30, 76, 'Home redesign in beta. Feature discovery up 8pp in testing.'),
  ci('ci-home-nav-3', 'okr-home-nav', '2026-02-10', 52, 78, 'Rolled out to 50% of users. Discovery rate at 32%.'),
  ci('ci-home-nav-4', 'okr-home-nav', '2026-02-24', 68, 80, 'Full rollout. Discovery at 36%. Close to 40% target.'),

  // ========== NOTIFICATIONS (AT RISK: 55→48→42→35) ==========
  ci('ci-notifs-1', 'okr-notifs', '2026-01-13', 8, 55, 'Push strategy defined. iOS 19 permission changes complicating.'),
  ci('ci-notifs-2', 'okr-notifs', '2026-01-27', 18, 48, 'iOS opt-in rate dropped 5pp after OS update. Adjusting copy.', 'Apple changed permission prompt UX; our pre-prompt flow needs rework.'),
  ci('ci-notifs-3', 'okr-notifs', '2026-02-10', 28, 42, 'New pre-prompt flow deployed. Marginal improvement.'),
  ci('ci-notifs-4', 'okr-notifs', '2026-02-24', 35, 35, 'Opt-in at 41%. Booking-driven push still disconnected from personalization.'),

  // ========== APP PERFORMANCE (ON TRACK: 78→80→82→85) ==========
  ci('ci-app-perf-1', 'okr-app-perf', '2026-01-13', 15, 78, 'Top crash sources identified. First fixes deployed.'),
  ci('ci-app-perf-2', 'okr-app-perf', '2026-01-27', 35, 80, 'Crash rate at 0.7%. Lazy loading reducing cold start.'),
  ci('ci-app-perf-3', 'okr-app-perf', '2026-02-10', 58, 82, 'Cold start at 2.5s. Bundle splitting in progress.'),
  ci('ci-app-perf-4', 'okr-app-perf', '2026-02-24', 75, 85, 'Crash rate 0.45%. Cold start 2.3s. Strong trajectory.'),

  // ========== MOBILE SEARCH (ON TRACK: 75→77→78→80) ==========
  ci('ci-mob-search-1', 'okr-mob-search', '2026-01-13', 12, 75, 'Thumb-zone optimization study complete. Redesign started.'),
  ci('ci-mob-search-2', 'okr-mob-search', '2026-01-27', 30, 77, 'New search UI in A/B. Completion rate up 5pp.'),
  ci('ci-mob-search-3', 'okr-mob-search', '2026-02-10', 52, 78, 'Voice search beta launched. 4% adoption in first week.'),
  ci('ci-mob-search-4', 'okr-mob-search', '2026-02-24', 68, 80, 'Search completion at 73%. Voice at 7.2%. On track.'),

  // ========== MOBILE CHECKOUT (AT RISK: 58→50→45→40) ==========
  ci('ci-mob-checkout-1', 'okr-mob-checkout', '2026-01-13', 8, 58, 'Mobile checkout audit done. Payment tokenization identified as bottleneck.'),
  ci('ci-mob-checkout-2', 'okr-mob-checkout', '2026-01-27', 18, 50, 'Tokenization timeouts on Android 12. Investigating SDK.', 'Payment SDK vendor says fix coming in March. Looking at alternatives.'),
  ci('ci-mob-checkout-3', 'okr-mob-checkout', '2026-02-10', 28, 45, 'Partial workaround deployed. Drop-off still at 42%.'),
  ci('ci-mob-checkout-4', 'okr-mob-checkout', '2026-02-24', 35, 40, 'Drop-off at 40%. 3-tap goal unlikely without SDK fix.'),

  // ========== MOBILE PAYMENTS (DECLINING: 60→48→38→32) ==========
  ci('ci-mob-pay-1', 'okr-mob-pay', '2026-01-13', 10, 60, 'Apple Pay integration started. Certification process initiated.'),
  ci('ci-mob-pay-2', 'okr-mob-pay', '2026-01-27', 20, 48, 'Apple certification process slower than expected.', 'Apple requesting additional PCI documentation. 3-week delay.'),
  ci('ci-mob-pay-3', 'okr-mob-pay', '2026-02-10', 30, 38, 'Certification still pending. Google Pay blocked on shared SDK.'),
  ci('ci-mob-pay-4', 'okr-mob-pay', '2026-02-24', 38, 32, 'Apple Pay likely mid-Q2 at earliest. Google Pay follows. Q1 targets missed.'),

  // ========== TRIP PLANNING (ON TRACK: 72→75→78→80) ==========
  ci('ci-trip-plan-1', 'okr-trip-plan', '2026-01-13', 10, 72, 'MVP wireframes approved. Development sprint 1 started.'),
  ci('ci-trip-plan-2', 'okr-trip-plan', '2026-01-27', 28, 75, 'Core itinerary builder shipped to beta group.'),
  ci('ci-trip-plan-3', 'okr-trip-plan', '2026-02-10', 50, 78, 'Beta adoption at 12%. User satisfaction at 4.0.'),
  ci('ci-trip-plan-4', 'okr-trip-plan', '2026-02-24', 68, 80, 'Adoption at 16%. Satisfaction 4.1. On pace for targets.'),

  // ========== ROOM SELECTION (RECOVERING: 68→55→60→65) ==========
  ci('ci-room-select-1', 'okr-room-select', '2026-01-13', 10, 68, 'Room comparison mockups approved. Photo assets requested.'),
  ci('ci-room-select-2', 'okr-room-select', '2026-01-27', 22, 55, 'Photo assets delayed for 30% of properties. Redesigning without.', 'Photography vendor behind schedule. Exploring AI-generated room previews.'),
  ci('ci-room-select-3', 'okr-room-select', '2026-02-10', 38, 60, 'Comparison tool MVP live with available assets. Upgrade conversion at 9.2%.'),
  ci('ci-room-select-4', 'okr-room-select', '2026-02-24', 50, 65, 'Conversion at 9.8%. AI previews filling gaps. Recovering.'),

  // ========== DIGITAL KEY (ON TRACK: 78→80→82→84) ==========
  ci('ci-digital-key-1', 'okr-digital-key', '2026-01-13', 12, 78, 'Hardware integration at 400 new properties complete.'),
  ci('ci-digital-key-2', 'okr-digital-key', '2026-01-27', 32, 80, '900 properties onboarded. Success rate at 92%.'),
  ci('ci-digital-key-3', 'okr-digital-key', '2026-02-10', 55, 82, '1,350 properties live. BLE reliability improvements deployed.'),
  ci('ci-digital-key-4', 'okr-digital-key', '2026-02-24', 72, 84, '1,650 properties. Success rate at 93%. Strong finish expected.'),

  // ========== CHAT & REQUESTS (RECOVERING: 65→52→58→64) ==========
  ci('ci-chat-1', 'okr-chat', '2026-01-13', 8, 65, 'In-app request feature soft launched at 100 properties.'),
  ci('ci-chat-2', 'okr-chat', '2026-01-27', 18, 52, 'Response times high. Staff not trained on new system.', 'Only 40% of front desk staff completed digital request training.'),
  ci('ci-chat-3', 'okr-chat', '2026-02-10', 32, 58, 'Training push underway. Response time improving. Adoption at 9%.'),
  ci('ci-chat-4', 'okr-chat', '2026-02-24', 45, 64, 'Training 60% complete. Adoption at 11.5%. Trending up.'),

  // ========== F&B ORDERING (AT RISK: 55→42→35→30) ==========
  ci('ci-fnb-1', 'okr-fnb', '2026-01-13', 8, 55, 'F&B ordering pilot at 50 owned properties. POS integration started.'),
  ci('ci-fnb-2', 'okr-fnb', '2026-01-27', 15, 42, 'Franchise POS systems incompatible. Only 120 properties onboarded.', 'Oracle Simphony integration failing at franchise locations. Need cloud POS.'),
  ci('ci-fnb-3', 'okr-fnb', '2026-02-10', 25, 35, 'Pivoting to cloud POS adapter. 150 properties live.'),
  ci('ci-fnb-4', 'okr-fnb', '2026-02-24', 32, 30, '180 properties. 500 target very unlikely. Revising to 300 stretch goal.'),

  // ========== ROOM CONTROLS (ON TRACK: 76→78→80→82) ==========
  ci('ci-room-ctrl-1', 'okr-room-ctrl', '2026-01-13', 10, 76, 'IoT hub integration at first 80 properties complete.'),
  ci('ci-room-ctrl-2', 'okr-room-ctrl', '2026-01-27', 28, 78, '150 properties live. Guest usage at 48%.'),
  ci('ci-room-ctrl-3', 'okr-room-ctrl', '2026-02-10', 50, 80, '240 properties. Usage rate climbing to 55%.'),
  ci('ci-room-ctrl-4', 'okr-room-ctrl', '2026-02-24', 68, 82, '240 done, 60 in staging. Usage at 58%. On track for 300.'),

  // ========== POINTS & EARN (ON TRACK: 74→76→78→80) ==========
  ci('ci-points-1', 'okr-points', '2026-01-13', 10, 74, 'Real-time tracker prototype in user testing.'),
  ci('ci-points-2', 'okr-points', '2026-01-27', 28, 76, 'Tracker launched in beta. 22% adoption. Satisfaction at 70.'),
  ci('ci-points-3', 'okr-points', '2026-02-10', 50, 78, 'Full rollout. 30% adoption. Satisfaction climbing to 72.'),
  ci('ci-points-4', 'okr-points', '2026-02-24', 68, 80, 'Adoption at 34%. Satisfaction at 74. On pace.'),

  // ========== REDEMPTION (DECLINING: 62→52→45→38) ==========
  ci('ci-redeem-1', 'okr-redeem', '2026-01-13', 8, 62, 'Redemption flow redesign started. Legal review initiated.'),
  ci('ci-redeem-2', 'okr-redeem', '2026-01-27', 18, 52, 'Legal requiring 2 new disclosure steps. Contradicts UX goals.', 'Regulatory counsel insists on explicit point value disclosure at each step.'),
  ci('ci-redeem-3', 'okr-redeem', '2026-02-10', 28, 45, 'Still 5 steps. Negotiating with legal on inline disclosures.'),
  ci('ci-redeem-4', 'okr-redeem', '2026-02-24', 35, 38, 'Expiration policy changes blocked. Breakage still at 20%. Escalating.'),

  // ========== ELITE STATUS (ON TRACK: 75→78→80→82) ==========
  ci('ci-elite-1', 'okr-elite', '2026-01-13', 12, 75, 'Dashboard design approved. API for benefits engine started.'),
  ci('ci-elite-2', 'okr-elite', '2026-01-27', 30, 78, 'MVP dashboard in beta. Engagement up 15% for test group.'),
  ci('ci-elite-3', 'okr-elite', '2026-02-10', 52, 80, 'Rolled out to Titanium and Ambassador members. Engagement +20%.'),
  ci('ci-elite-4', 'okr-elite', '2026-02-24', 68, 82, 'Full elite rollout next week. Engagement at +24%.'),

  // ========== OFFERS & PROMOTIONS (ON TRACK: 76→78→80→82) ==========
  ci('ci-offers-1', 'okr-offers', '2026-01-13', 10, 76, 'AI targeting model training on historical offer data.'),
  ci('ci-offers-2', 'okr-offers', '2026-01-27', 28, 78, 'AI model v1 deployed. Redemption rate at 5.8%.'),
  ci('ci-offers-3', 'okr-offers', '2026-02-10', 50, 80, 'Model v2 with real-time signals. Redemption at 6.1%.'),
  ci('ci-offers-4', 'okr-offers', '2026-02-24', 68, 82, 'Redemption at 6.4%. AI targeting 78% deployed. On track.'),

  // ========== PARTNERSHIPS (RECOVERING: 68→55→60→65) ==========
  ci('ci-partners-1', 'okr-partners', '2026-01-13', 10, 68, '2 partnerships signed (Uber, Hertz). 3 in negotiation.'),
  ci('ci-partners-2', 'okr-partners', '2026-01-27', 22, 55, 'Airline partnership stalled. Revenue attribution model disputed.', 'Delta codeshare terms changed. Renegotiating earn rates.'),
  ci('ci-partners-3', 'okr-partners', '2026-02-10', 35, 60, '3rd partnership (DoorDash) signed. Airline still pending.'),
  ci('ci-partners-4', 'okr-partners', '2026-02-24', 48, 65, '3 live. Revenue at $4.5M. Airline deal close to resolution.'),

  // ========== MEMBER COMMS (ON TRACK: 74→76→78→80) ==========
  ci('ci-member-comms-1', 'okr-member-comms', '2026-01-13', 12, 74, 'Segmentation engine upgraded. First 4 segments deployed.'),
  ci('ci-member-comms-2', 'okr-member-comms', '2026-01-27', 30, 76, '7 segments live. Open rate at 22%.'),
  ci('ci-member-comms-3', 'okr-member-comms', '2026-02-10', 52, 78, '10 segments. Open rate at 24%. Behavioral triggers live.'),
  ci('ci-member-comms-4', 'okr-member-comms', '2026-02-24', 68, 80, 'Open rate at 25%. 10 of 12 segments deployed. On pace.'),

  // ========== PAYMENT PROCESSING (AT RISK: 55→45→38→35) ==========
  ci('ci-pay-proc-1', 'okr-pay-proc', '2026-01-13', 10, 55, 'Retry logic spec complete. Waiting on gateway v2.3.'),
  ci('ci-pay-proc-2', 'okr-pay-proc', '2026-01-27', 20, 45, 'Gateway update delayed to March. Error rate still at 4.1%.', 'Vendor blaming infrastructure migration. No firm date.'),
  ci('ci-pay-proc-3', 'okr-pay-proc', '2026-02-10', 30, 38, 'Partial retry deployed. Error rate at 3.9%. Minimal improvement.'),
  ci('ci-pay-proc-4', 'okr-pay-proc', '2026-02-24', 38, 35, 'Error rate 3.8%. Gateway still unstable. Evaluating backup vendor.'),

  // ========== FRAUD & RISK (ON TRACK: 76→78→80→82) ==========
  ci('ci-fraud-1', 'okr-fraud', '2026-01-13', 12, 76, 'ML model v3 training on expanded feature set.'),
  ci('ci-fraud-2', 'okr-fraud', '2026-01-27', 30, 78, 'Model v3 deployed to US/Canada. False positives down 12%.'),
  ci('ci-fraud-3', 'okr-fraud', '2026-02-10', 52, 80, 'Expanded to EMEA. False positive rate at 2.6%.'),
  ci('ci-fraud-4', 'okr-fraud', '2026-02-24', 70, 82, 'APAC rollout next. Rate at 2.5%. 85% coverage. On track.'),

  // ========== BILLING (ON TRACK: 72→75→78→80) ==========
  ci('ci-billing-1', 'okr-billing', '2026-01-13', 10, 72, 'Automated dispute triage system in development.'),
  ci('ci-billing-2', 'okr-billing', '2026-01-27', 28, 75, 'Triage deployed. 60% of disputes auto-categorized.'),
  ci('ci-billing-3', 'okr-billing', '2026-02-10', 48, 78, 'Auto-resolution for simple disputes live. 72% automated.'),
  ci('ci-billing-4', 'okr-billing', '2026-02-24', 65, 80, '78% automated. Resolution time at 7 days. On pace.'),

  // ========== RATE STRATEGY (RECOVERING: 70→58→64→68) ==========
  ci('ci-rate-strat-1', 'okr-rate-strat', '2026-01-13', 10, 70, 'Dynamic pricing model v4 in training with 2025 data.'),
  ci('ci-rate-strat-2', 'okr-rate-strat', '2026-01-27', 22, 58, 'OTA parity violations spiked. Model accuracy dropped with new competitor rates.', 'Booking.com changed rate display. Our parity monitoring broke.'),
  ci('ci-rate-strat-3', 'okr-rate-strat', '2026-02-10', 38, 64, 'Monitoring fixed. Model retrained. Accuracy recovering to 83%.'),
  ci('ci-rate-strat-4', 'okr-rate-strat', '2026-02-24', 52, 68, 'Accuracy at 85%. Parity violations down 28%. Recovering.'),

  // ========== DISTRIBUTION (ON TRACK: 76→78→80→82) ==========
  ci('ci-distrib-1', 'okr-distrib', '2026-01-13', 10, 76, 'Direct channel marketing campaigns launched for Q1.'),
  ci('ci-distrib-2', 'okr-distrib', '2026-01-27', 28, 78, 'Direct share at 33.5%. Member-only rates driving shift.'),
  ci('ci-distrib-3', 'okr-distrib', '2026-02-10', 50, 80, 'Direct share at 35%. Commission savings at $6M.'),
  ci('ci-distrib-4', 'okr-distrib', '2026-02-24', 68, 82, 'Direct at 35.5%. Savings at $8.5M. On track for 38%.'),

  // ========== DIRECT CHANNEL (AT RISK: 58→48→42→36) ==========
  ci('ci-direct-1', 'okr-direct', '2026-01-13', 8, 58, 'BRG promotion campaign launched. Member rate visibility improved.'),
  ci('ci-direct-2', 'okr-direct', '2026-01-27', 18, 48, 'Competitor rate matching making BRG less effective.', 'Expedia and Booking.com both running aggressive price match campaigns.'),
  ci('ci-direct-3', 'okr-direct', '2026-02-10', 28, 42, 'BRG conversions only +12%. Member rates at +14% adoption.'),
  ci('ci-direct-4', 'okr-direct', '2026-02-24', 35, 36, 'Revenue team pushing back on member rate expansion. Escalating.'),
];

// ======================== JIRA LINKS (sample) ========================

export const jiraLinks: JiraLink[] = [
  { id: 'jl-1', okrId: 'okr-search', epicIdentifierOrUrl: 'SHOP-142' },
  { id: 'jl-2', okrId: 'okr-book-exp', epicIdentifierOrUrl: 'BOOK-89' },
  { id: 'jl-3', okrId: 'okr-checkout', epicIdentifierOrUrl: 'BOOK-112' },
  { id: 'jl-4', okrId: 'okr-mob-pay', epicIdentifierOrUrl: 'MPAY-34' },
  { id: 'jl-5', okrId: 'okr-digital-key', epicIdentifierOrUrl: 'GUEST-67' },
  { id: 'jl-6', okrId: 'okr-pay-proc', epicIdentifierOrUrl: 'PAY-201' },
  { id: 'jl-7', okrId: 'okr-fnb', epicIdentifierOrUrl: 'PROP-55' },
  { id: 'jl-8', okrId: 'okr-fraud', epicIdentifierOrUrl: 'PAY-188' },
];
