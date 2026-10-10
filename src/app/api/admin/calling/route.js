import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getLiveShops, VERIFIED_SHOPS } from '@/lib/omni-data';

function parseOmniDate(str) {
  if (!str) {
    const now = new Date();
    return { startTime: now, dateKey: now.toISOString().slice(0, 10) };
  }
  const parts = str.trim().split(' ');
  if (parts.length === 2) {
    const [dPart, tPart] = parts;
    const [m, d, y] = dPart.split('/').map(Number);
    const [hh, mm, ss] = tPart.split(':').map(Number);
    // OmniDimension logs are UTC
    const dateObj = new Date(Date.UTC(y, m - 1, d, hh, mm, ss || 0));
    const pad = (n) => String(n).padStart(2, '0');
    const dateKey = `${y}-${pad(m)}-${pad(d)}`;
    return { startTime: dateObj, dateKey };
  }
  const dateObj = new Date(str);
  return {
    startTime: isNaN(dateObj.getTime()) ? new Date() : dateObj,
    dateKey: dateObj.toISOString().slice(0, 10),
  };
}

function formatTimeOnly(date) {
  if (!date) return '';
  // Format as readable AM/PM
  let h = date.getUTCHours();
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m}:${s} ${ampm}`;
}

function getDayLabel(dateKey) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayKey = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = `${yesterday.getUTCFullYear()}-${pad(yesterday.getUTCMonth() + 1)}-${pad(yesterday.getUTCDate())}`;

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  const [y, m, d] = (dateKey || '').split('-').map(Number);
  if (!y || !m || !d) return dateKey || 'Unknown Date';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${monthNames[m - 1]} ${y}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('date'); // 'all' | 'today' | 'yesterday' | 'YYYY-MM-DD'
    const filterType = searchParams.get('type'); // 'all' | 'barber' | 'customer'
    const filterStatus = searchParams.get('status'); // 'all' | 'completed' | 'no-answer' | etc.
    const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const targetAgentId = process.env.OMNI_AGENT_ID || '265888';

    // 1. Fetch live registered shops & users to correlate caller identity
    let shopMap = new Map();
    try {
      const liveShops = await getLiveShops().catch(() => VERIFIED_SHOPS);
      liveShops.forEach((s) => {
        const digits = String(s.ownerPhone || '').replace(/\D/g, '').slice(-10);
        if (digits) {
          shopMap.set(digits, {
            name: s.ownerName || 'Shop Owner',
            shopName: s.name,
            city: s.city,
            callType: 'barber',
          });
        }
      });
    } catch (_) {}

    let userMap = new Map();
    try {
      const usersCol = await getCollection('users').catch(() => null);
      if (usersCol) {
        const users = await usersCol.find({}).project({ name: 1, phone: 1, phoneNumber: 1 }).toArray();
        users.forEach((u) => {
          const digits = String(u.phone || u.phoneNumber || '').replace(/\D/g, '').slice(-10);
          if (digits) {
            userMap.set(digits, {
              name: u.name || 'Registered Customer',
              callType: 'customer',
            });
          }
        });
      }
    } catch (_) {}

    // Add known defaults
    if (!userMap.has('9580133593')) {
      userMap.set('9580133593', { name: 'Niransh', callType: 'customer' });
    }

    // 2. Fetch recent calls directly from OmniDimension API
    let omniCalls = [];
    try {
      const omniRes = await fetch(`https://backend.omnidim.io/api/v1/calls/logs?agent_id=${targetAgentId}&page_size=100`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'x-api-key': apiKey },
        next: { revalidate: 0 },
      });
      if (omniRes.ok) {
        const omniData = await omniRes.json();
        omniCalls = omniData.call_log_data || [];
      }
    } catch (err) {
      console.error('OmniDimension logs fetch error:', err.message);
    }

    // 3. Process and persist OmniDimension calls to MongoDB
    const callsCol = await getCollection('call_summaries').catch(() => null);

    const processedLogs = [];

    for (const r of omniCalls) {
      const phoneDigits = String(r.to_number || '').replace(/\D/g, '').slice(-10);
      const { startTime, dateKey } = parseOmniDate(r.time_of_call);
      const durationSec = r.call_duration_in_seconds || 0;
      const endTime = new Date(startTime.getTime() + durationSec * 1000);

      const shopMatch = shopMap.get(phoneDigits);
      const userMatch = userMap.get(phoneDigits);

      let callerName = '';
      let shopName = '';
      let callType = 'customer';

      if (shopMatch) {
        callerName = shopMatch.name;
        shopName = shopMatch.shopName;
        callType = 'barber';
      } else if (userMatch) {
        callerName = userMatch.name;
        callType = 'customer';
      } else if (r.extracted_variables && r.extracted_variables.caller_name && r.extracted_variables.caller_name !== 'Not provided') {
        callerName = r.extracted_variables.caller_name;
      } else {
        callerName = 'Direct Contact';
      }

      const startedAtStr = formatTimeOnly(startTime);
      const endedAtStr = formatTimeOnly(endTime);
      const runTillText = durationSec > 0
        ? `Ran from ${startedAtStr} till ${endedAtStr} (${durationSec}s)`
        : `Dialed at ${startedAtStr} (No answer)`;

      const recordingUrl = r.internal_recording_url || (r.recording_url ? `https://omnidim.io${r.recording_url}` : '');
      const summaryText = r.sentiment_analysis_details || 'Outbound call placed by Riya assistant';

      const logItem = {
        omniCallId: String(r.id),
        phone: r.to_number || `+91${phoneDigits}`,
        name: callerName,
        shopName,
        callType,
        status: r.call_status || 'completed',
        durationSeconds: durationSec,
        durationFormatted: durationSec >= 60 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : `${durationSec}s`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        startedAtStr,
        endedAtStr,
        runTillText,
        dateKey,
        dayLabel: getDayLabel(dateKey),
        recordingUrl,
        summary: summaryText,
        transcript: r.call_conversation || '',
        hangupReason: r.hangup_reason || '',
        callCost: r.call_cost || 0,
        createdAt: startTime,
      };

      processedLogs.push(logItem);

      // Upsert to MongoDB asynchronously
      if (callsCol) {
        callsCol
          .updateOne(
            { omniCallId: String(r.id) },
            { $set: logItem },
            { upsert: true }
          )
          .catch(() => {});
      }
    }

    // 4. Fetch additional manual call summaries from DB that might not have an OmniCallId yet
    if (callsCol) {
      const dbLogs = await callsCol
        .find({ omniCallId: { $exists: false } })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()
        .catch(() => []);

      dbLogs.forEach((dbItem) => {
        const cDate = dbItem.createdAt ? new Date(dbItem.createdAt) : new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateKey = `${cDate.getUTCFullYear()}-${pad(cDate.getUTCMonth() + 1)}-${pad(cDate.getUTCDate())}`;
        const startedAtStr = formatTimeOnly(cDate);

        processedLogs.push({
          omniCallId: `db_${dbItem._id}`,
          phone: dbItem.phone || 'N/A',
          name: dbItem.name || 'Direct Contact',
          shopName: dbItem.shopName || '',
          callType: dbItem.callType || 'customer',
          status: dbItem.status || 'dispatched',
          durationSeconds: dbItem.durationSeconds || 0,
          durationFormatted: `${dbItem.durationSeconds || 0}s`,
          startTime: cDate.toISOString(),
          endTime: cDate.toISOString(),
          startedAtStr,
          endedAtStr: startedAtStr,
          runTillText: `Dispatched at ${startedAtStr}`,
          dateKey,
          dayLabel: getDayLabel(dateKey),
          recordingUrl: dbItem.recordingUrl || '',
          summary: dbItem.summary || 'Outbound call dispatched',
          transcript: dbItem.transcript || '',
          createdAt: cDate,
        });
      });
    }

    // Sort by startTime descending
    processedLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // 5. Gather Distinct Dates for date filter dropdown
    const dateCounts = {};
    processedLogs.forEach((l) => {
      dateCounts[l.dateKey] = (dateCounts[l.dateKey] || 0) + 1;
    });

    const availableDates = Object.keys(dateCounts)
      .sort((a, b) => b.localeCompare(a))
      .map((dKey) => ({
        dateKey: dKey,
        label: getDayLabel(dKey),
        count: dateCounts[dKey],
      }));

    // 6. Apply Filters
    let filteredLogs = [...processedLogs];

    // Filter by Date
    if (filterDate && filterDate !== 'all') {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const todayKey = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayKey = `${yesterday.getUTCFullYear()}-${pad(yesterday.getUTCMonth() + 1)}-${pad(yesterday.getUTCDate())}`;

      if (filterDate === 'today') {
        filteredLogs = filteredLogs.filter((l) => l.dateKey === todayKey);
      } else if (filterDate === 'yesterday') {
        filteredLogs = filteredLogs.filter((l) => l.dateKey === yesterdayKey);
      } else {
        filteredLogs = filteredLogs.filter((l) => l.dateKey === filterDate);
      }
    }

    // Filter by Type
    if (filterType && filterType !== 'all') {
      filteredLogs = filteredLogs.filter((l) => l.callType === filterType);
    }

    // Filter by Status
    if (filterStatus && filterStatus !== 'all') {
      filteredLogs = filteredLogs.filter((l) => l.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // Filter by Search Query
    if (searchQuery) {
      filteredLogs = filteredLogs.filter((l) =>
        (l.name && l.name.toLowerCase().includes(searchQuery)) ||
        (l.phone && l.phone.includes(searchQuery)) ||
        (l.shopName && l.shopName.toLowerCase().includes(searchQuery)) ||
        (l.summary && l.summary.toLowerCase().includes(searchQuery))
      );
    }

    // 7. Group Day-wise for UI
    const dayGroupsMap = new Map();
    filteredLogs.forEach((log) => {
      const groupKey = log.dateKey;
      if (!dayGroupsMap.has(groupKey)) {
        dayGroupsMap.set(groupKey, {
          dateKey: groupKey,
          label: log.dayLabel,
          logs: [],
          totalDuration: 0,
          completedCount: 0,
        });
      }
      const group = dayGroupsMap.get(groupKey);
      group.logs.push(log);
      group.totalDuration += log.durationSeconds;
      if (log.status.toLowerCase() === 'completed') {
        group.completedCount += 1;
      }
    });

    const dayGroups = Array.from(dayGroupsMap.values());

    // 8. Aggregate Stats
    const totalCalls = filteredLogs.length;
    const completedCalls = filteredLogs.filter((l) => l.status.toLowerCase() === 'completed').length;
    const noAnswerCalls = filteredLogs.filter((l) => l.status.toLowerCase() === 'no-answer').length;
    const totalDurationSeconds = filteredLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
    const averageDurationSeconds = completedCalls > 0 ? Math.round(totalDurationSeconds / completedCalls) : 0;

    // 9. Extra Dashboard data: Missing requests & Inactive Barbers
    let missingRequests = [];
    let inactiveBarbers = [];
    try {
      const reqCol = await getCollection('missing_barber_requests').catch(() => null);
      if (reqCol) {
        missingRequests = await reqCol.find({}).sort({ createdAt: -1 }).toArray();
      }
      const shopsCol = await getCollection('shops').catch(() => null);
      if (shopsCol) {
        inactiveBarbers = await shopsCol
          .find({ $or: [{ isActive: false }, { approvalStatus: { $ne: 'approved' } }] })
          .project({ name: 1, 'owner.name': 1, 'owner.phone': 1 })
          .toArray();
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      dayGroups,
      availableDates,
      stats: {
        totalCalls,
        completedCalls,
        noAnswerCalls,
        totalDurationSeconds,
        averageDurationSeconds,
      },
      missingRequests,
      inactiveBarbers,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
