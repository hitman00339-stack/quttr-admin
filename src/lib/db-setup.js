import { getDb } from './mongodb';

export async function setupDatabase() {
  const db = await getDb();
  
  const results = {
    collections: [],
    indexes: [],
    errors: [],
  };

  try {
    // QR CODES COLLECTION
    const qrCodes = db.collection('qr_codes');
    await qrCodes.createIndex({ short_code: 1 }, { unique: true });
    await qrCodes.createIndex({ status: 1 });
    await qrCodes.createIndex({ batch_number: 1 });
    await qrCodes.createIndex({ created_at: -1 });
    results.collections.push('qr_codes');

    // QR ACTIVATIONS COLLECTION
    const activations = db.collection('qr_activations');
    await activations.createIndex({ qr_id: 1 }, { unique: true });
    await activations.createIndex({ field_person_id: 1 });
    await activations.createIndex({ 'location.city': 1 });
    await activations.createIndex({ 'location.state': 1 });
    await activations.createIndex({ location_type: 1 });
    await activations.createIndex({ activated_at: -1 });
    results.collections.push('qr_activations');

    // SCAN EVENTS COLLECTION
    const scanEvents = db.collection('scan_events');
    await scanEvents.createIndex({ qr_id: 1, scanned_at: -1 });
    await scanEvents.createIndex({ scanned_at: -1 });
    await scanEvents.createIndex({ session_id: 1 });
    await scanEvents.createIndex(
      { scanned_at: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 365 }
    );
    results.collections.push('scan_events');

    // INACTIVE QR SCANS
    const inactiveScans = db.collection('inactive_scans');
    await inactiveScans.createIndex({ qr_id: 1, scanned_at: -1 });
    await inactiveScans.createIndex(
      { scanned_at: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 90 }
    );
    results.collections.push('inactive_scans');

    // LANDING PAGE RULES
    const landingRules = db.collection('landing_rules');
    await landingRules.createIndex({ rule_level: 1, priority: -1 });
    await landingRules.createIndex({ is_active: 1 });
    results.collections.push('landing_rules');

    // FIELD TEAM
    const fieldTeam = db.collection('field_team');
    await fieldTeam.createIndex({ phone: 1 }, { unique: true });
    await fieldTeam.createIndex({ is_active: 1 });
    results.collections.push('field_team');

    // PAGE EVENTS
    const pageEvents = db.collection('page_events');
    await pageEvents.createIndex({ session_id: 1 });
    await pageEvents.createIndex({ qr_id: 1 });
    await pageEvents.createIndex({ occurred_at: -1 });
    await pageEvents.createIndex(
      { occurred_at: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 180 }
    );
    results.collections.push('page_events');

    // LEADS
    const leads = db.collection('leads');
    await leads.createIndex({ phone: 1 });
    await leads.createIndex({ qr_id: 1 });
    await leads.createIndex({ submitted_at: -1 });
    results.collections.push('leads');

    // CHANGE LOG
    const changeLog = db.collection('change_log');
    await changeLog.createIndex({ changed_at: -1 });
    await changeLog.createIndex({ changed_by: 1 });
    results.collections.push('change_log');

    // CAMPAIGNS
    const campaigns = db.collection('campaigns');
    await campaigns.createIndex({ is_active: 1 });
    await campaigns.createIndex({ start_date: 1, end_date: 1 });
    results.collections.push('campaigns');

    return {
      success: true,
      message: 'Database setup complete',
      ...results,
    };
  } catch (error) {
    console.error('Database setup error:', error);
    results.errors.push(error.message);
    return {
      success: false,
      message: 'Database setup failed',
      ...results,
    };
  }
}
