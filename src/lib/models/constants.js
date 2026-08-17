export const QR_STATUS = {
  UNPRINTED: 'UNPRINTED',
  INACTIVE: 'INACTIVE',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  FLAGGED: 'FLAGGED',
  EXPIRED: 'EXPIRED',
  DAMAGED: 'DAMAGED',
};

export const LOCATION_TYPES = [
  { id: 'barber_shop', name: 'Barber Shop', icon: '💈', requires_shop: true, requires_owner: true },
  { id: 'salon', name: 'Salon / Beauty Parlour', icon: '💇', requires_shop: true, requires_owner: true },
  { id: 'public_place', name: 'Public Place', icon: '🏙️', requires_shop: false, requires_owner: false },
  { id: 'vehicle', name: 'Vehicle (Auto/Bus/Cab)', icon: '🚗', requires_shop: false, requires_vehicle: true },
  { id: 'restaurant', name: 'Restaurant / Cafe', icon: '🍽️', requires_shop: true, requires_owner: true },
  { id: 'gym', name: 'Gym / Fitness Center', icon: '💪', requires_shop: true, requires_owner: true },
  { id: 'medical', name: 'Medical Store / Clinic', icon: '⚕️', requires_shop: true, requires_owner: false },
  { id: 'kirana', name: 'Kirana / General Store', icon: '🏪', requires_shop: true, requires_owner: true },
  { id: 'mall', name: 'Mall / Shopping Complex', icon: '🏬', requires_shop: true, requires_owner: false },
  { id: 'office', name: 'Office / Coworking', icon: '🏢', requires_shop: true, requires_owner: false },
  { id: 'college', name: 'College / Institute', icon: '🎓', requires_shop: true, requires_owner: false },
  { id: 'transit', name: 'Bus Stop / Metro Station', icon: '🚏', requires_shop: false, requires_owner: false },
  { id: 'other', name: 'Other', icon: '📍', requires_shop: false, requires_owner: false },
];

export const VEHICLE_TYPES = [
  { id: 'auto', name: 'Auto Rickshaw' },
  { id: 'bus', name: 'Bus' },
  { id: 'cab', name: 'Taxi / Cab' },
  { id: 'truck', name: 'Truck / Delivery' },
  { id: 'bike', name: 'Bike / Scooter' },
  { id: 'other', name: 'Other Vehicle' },
];

export const PLACEMENT_POSITIONS = [
  { id: 'entrance', name: 'Near Entrance' },
  { id: 'inside', name: 'Inside / Waiting Area' },
  { id: 'counter', name: 'Counter / Billing Area' },
  { id: 'window', name: 'Window / Glass' },
  { id: 'wall', name: 'Wall / Pole' },
  { id: 'vehicle_back', name: 'Vehicle Back' },
  { id: 'vehicle_side', name: 'Vehicle Side' },
  { id: 'vehicle_inside', name: 'Inside Vehicle' },
  { id: 'other', name: 'Other Position' },
];

export const RULE_LEVELS = {
  GLOBAL: { level: 'GLOBAL', priority: 1 },
  CAMPAIGN: { level: 'CAMPAIGN', priority: 2 },
  STATE: { level: 'STATE', priority: 3 },
  TYPE: { level: 'TYPE', priority: 4 },
  CITY: { level: 'CITY', priority: 5 },
  CITY_TYPE: { level: 'CITY_TYPE', priority: 6 },
  AREA: { level: 'AREA', priority: 7 },
  SHOP: { level: 'SHOP', priority: 8 },
  QR: { level: 'QR', priority: 9 },
};

export const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  CUSTOMER_DOWNLOAD_CLICK: 'customer_download_click',
  BUSINESS_DOWNLOAD_CLICK: 'business_download_click',
  FEATURES_VIEW: 'features_view',
  BARBER_SECTION_VIEW: 'barber_section_view',
  SOCIAL_INSTAGRAM: 'social_instagram_click',
  SOCIAL_WHATSAPP: 'social_whatsapp_click',
  SOCIAL_EMAIL: 'social_email_click',
  SOCIAL_CALL: 'social_call_click',
  SOCIAL_WEBSITE: 'social_website_click',
  PAGE_EXIT: 'page_exit',
};

export const INDIAN_STATES = [
  { id: 'AN', name: 'Andaman and Nicobar Islands' },
  { id: 'AP', name: 'Andhra Pradesh' },
  { id: 'AR', name: 'Arunachal Pradesh' },
  { id: 'AS', name: 'Assam' },
  { id: 'BR', name: 'Bihar' },
  { id: 'CH', name: 'Chandigarh' },
  { id: 'CT', name: 'Chhattisgarh' },
  { id: 'DN', name: 'Dadra and Nagar Haveli' },
  { id: 'DD', name: 'Daman and Diu' },
  { id: 'DL', name: 'Delhi' },
  { id: 'GA', name: 'Goa' },
  { id: 'GJ', name: 'Gujarat' },
  { id: 'HR', name: 'Haryana' },
  { id: 'HP', name: 'Himachal Pradesh' },
  { id: 'JK', name: 'Jammu and Kashmir' },
  { id: 'JH', name: 'Jharkhand' },
  { id: 'KA', name: 'Karnataka' },
  { id: 'KL', name: 'Kerala' },
  { id: 'LA', name: 'Ladakh' },
  { id: 'LD', name: 'Lakshadweep' },
  { id: 'MP', name: 'Madhya Pradesh' },
  { id: 'MH', name: 'Maharashtra' },
  { id: 'MN', name: 'Manipur' },
  { id: 'ML', name: 'Meghalaya' },
  { id: 'MZ', name: 'Mizoram' },
  { id: 'NL', name: 'Nagaland' },
  { id: 'OR', name: 'Odisha' },
  { id: 'PY', name: 'Puducherry' },
  { id: 'PB', name: 'Punjab' },
  { id: 'RJ', name: 'Rajasthan' },
  { id: 'SK', name: 'Sikkim' },
  { id: 'TN', name: 'Tamil Nadu' },
  { id: 'TG', name: 'Telangana' },
  { id: 'TR', name: 'Tripura' },
  { id: 'UP', name: 'Uttar Pradesh' },
  { id: 'UT', name: 'Uttarakhand' },
  { id: 'WB', name: 'West Bengal' },
];

export const FIELD_ROLES = {
  AGENT: 'field_agent',
  SUPERVISOR: 'supervisor',
  MANAGER: 'manager',
};

export function getLocationType(typeId) {
  return LOCATION_TYPES.find(t => t.id === typeId);
}

export function getState(stateId) {
  return INDIAN_STATES.find(s => s.id === stateId);
}
