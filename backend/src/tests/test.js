import pool from '../config/db.js';

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting backend API integration tests...');
  let ownerToken = '';
  let ownerId = null;
  let participantToken = '';
  let participantId = null;
  let eventId = null;

  try {
    // 0. Clean database for testing (in raw SQL)
    console.log('🧹 Cleaning test data from database...');
    await pool.query("DELETE FROM users WHERE email IN ('owner@test.com', 'participant@test.com')");

    // 1. Register Owner
    console.log('1. Registering Owner...');
    const regOwnerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Event Owner',
        email: 'owner@test.com',
        password: 'password123'
      })
    });
    const regOwnerData = await regOwnerRes.json();
    if (!regOwnerRes.ok || !regOwnerData.success) {
      throw new Error(`Owner registration failed: ${regOwnerData.message}`);
    }
    ownerToken = regOwnerData.token;
    ownerId = regOwnerData.user.id;
    console.log(`✅ Owner registered successfully! ID: ${ownerId}`);

    // 2. Register Participant
    console.log('2. Registering Participant...');
    const regPartRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Event Participant',
        email: 'participant@test.com',
        password: 'password123'
      })
    });
    const regPartData = await regPartRes.json();
    if (!regPartRes.ok || !regPartData.success) {
      throw new Error(`Participant registration failed: ${regPartData.message}`);
    }
    participantToken = regPartData.token;
    participantId = regPartData.user.id;
    console.log(`✅ Participant registered successfully! ID: ${participantId}`);

    // 3. Create Event (as Owner)
    console.log('3. Creating Event...');
    const createEventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: 'NextJS Hackathon 2026',
        description: 'A premium NextJS hackathon sponsored by Vercel',
        date: '2026-10-15',
        location: 'San Francisco, CA'
      })
    });
    const createEventData = await createEventRes.json();
    if (!createEventRes.ok || !createEventData.success) {
      throw new Error(`Event creation failed: ${createEventData.message}`);
    }
    eventId = createEventData.event.id;
    console.log(`✅ Event created successfully! ID: ${eventId}`);

    // 4. List Events (Public)
    console.log('4. Listing Events...');
    const listEventsRes = await fetch(`${BASE_URL}/events`);
    const listEventsData = await listEventsRes.json();
    if (!listEventsRes.ok || !listEventsData.success) {
      throw new Error(`Listing events failed: ${listEventsData.message}`);
    }
    const foundEvent = listEventsData.events.find(e => e.id === eventId);
    if (!foundEvent) {
      throw new Error('Created event not found in list');
    }
    console.log(`✅ List events verified! Found ${listEventsData.events.length} events.`);

    // 5. Register Participant for Event (as Participant)
    console.log('5. Registering Participant for Event...');
    const registerRes = await fetch(`${BASE_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      }
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok || !registerData.success) {
      throw new Error(`Registering for event failed: ${registerData.message}`);
    }
    console.log(`✅ Registration successful! Status: ${registerData.registration.status}`);

    // 6. Get Event Details with registration status (as Participant)
    console.log('6. Checking Event Details & Participant status...');
    const eventDetailsRes = await fetch(`${BASE_URL}/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${participantToken}`
      }
    });
    const eventDetailsData = await eventDetailsRes.json();
    if (!eventDetailsRes.ok || !eventDetailsData.success) {
      throw new Error(`Fetching event details failed: ${eventDetailsData.message}`);
    }
    if (eventDetailsData.registration?.status !== 'registered') {
      throw new Error('Registration status should be "registered"');
    }
    console.log(`✅ Participant details status verified: ${eventDetailsData.registration.status}`);

    // 7. Get Participants List (as Owner)
    console.log('7. Fetching Participants (as Owner)...');
    const getPartsRes = await fetch(`${BASE_URL}/events/${eventId}/participants`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`
      }
    });
    const getPartsData = await getPartsRes.json();
    if (!getPartsRes.ok || !getPartsData.success) {
      throw new Error(`Fetching participants list failed: ${getPartsData.message}`);
    }
    const partEntry = getPartsData.participants.find(p => p.user_id === participantId);
    if (!partEntry) {
      throw new Error('Participant not found in owner participants list');
    }
    console.log(`✅ Owner participant list verified! Found: ${partEntry.user_name} (${partEntry.status})`);

    // 8. Cancel Registration with Reason (as Owner)
    console.log('8. Cancelling Registration with Reason (as Owner)...');
    const cancelRes = await fetch(`${BASE_URL}/events/${eventId}/participants/${participantId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        reason: 'Violation of Code of Conduct'
      })
    });
    const cancelData = await cancelRes.json();
    if (!cancelRes.ok || !cancelData.success) {
      throw new Error(`Cancellation failed: ${cancelData.message}`);
    }
    console.log(`✅ Cancellation successful! Reason: ${cancelData.registration.cancellation_reason}`);

    // 9. Re-verify registration status (as Participant)
    console.log('9. Re-checking Event Details (as Participant)...');
    const eventDetailsRes2 = await fetch(`${BASE_URL}/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${participantToken}`
      }
    });
    const eventDetailsData2 = await eventDetailsRes2.json();
    if (eventDetailsData2.registration?.status !== 'cancelled' || eventDetailsData2.registration?.cancellation_reason !== 'Violation of Code of Conduct') {
      throw new Error('Registration status was not updated to cancelled or reason is missing');
    }
    console.log(`✅ Participant cancellation status & reason verified successfully!`);

    // 10. Delete Event (as Owner)
    console.log('10. Deleting Event...');
    const deleteRes = await fetch(`${BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ownerToken}`
      }
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok || !deleteData.success) {
      throw new Error(`Event deletion failed: ${deleteData.message}`);
    }
    console.log('✅ Event deleted successfully!');

    // 11. Verify deleted
    console.log('11. Verifying deleted event is missing...');
    const checkDeletedRes = await fetch(`${BASE_URL}/events/${eventId}`);
    if (checkDeletedRes.status !== 404) {
      throw new Error('Deleted event should return 404');
    }
    console.log('✅ Delete verification successful!');

    console.log('\n🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    // End pool to let script exit
    await pool.end();
  }
};

runTests();
