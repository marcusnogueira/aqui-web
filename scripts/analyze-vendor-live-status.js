#!/usr/bin/env node

/**
 * Script to analyze vendor live status and identify discrepancies
 * 
 * Source of Truth for Live Vendors:
 * 1. vendors.is_active = true (vendor account is active)
 * 2. vendors.is_approved = true (vendor is approved by admin)
 * 3. vendor_live_sessions.is_active = true (has an active live session)
 * 4. vendor_live_sessions.end_time IS NULL OR end_time > NOW() (session hasn't ended)
 * 5. vendor_live_sessions.auto_end_time IS NULL OR auto_end_time > NOW() (session hasn't auto-ended)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeVendorLiveStatus() {
  console.log('🔍 Analyzing vendor live status...');
  console.log('=' .repeat(60));

  try {
    // Get all vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        is_active,
        is_approved,
        created_at
      `);

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }

    // Get all live sessions
    const { data: liveSessions, error: sessionsError } = await supabase
      .from('vendor_live_sessions')
      .select(`
        id,
        vendor_id,
        is_active,
        start_time,
        end_time,
        auto_end_time,
        latitude,
        longitude,
        address,
        created_at
      `);

    if (sessionsError) {
      console.error('❌ Error fetching live sessions:', sessionsError);
      return;
    }

    // Manually join the data
    const vendorsWithSessions = vendors.map(vendor => ({
      ...vendor,
      vendor_live_sessions: liveSessions.filter(session => session.vendor_id === vendor.id)
    }));

    console.log(`📊 Total vendors in database: ${vendors.length}`);
    console.log(`📊 Total live sessions in database: ${liveSessions.length}`);
    console.log('');

    // Analyze vendor categories
    const activeVendors = vendorsWithSessions.filter(v => v.is_active);
    const approvedVendors = vendorsWithSessions.filter(v => v.is_approved);
    const eligibleVendors = vendorsWithSessions.filter(v => v.is_active && v.is_approved);
    
    console.log('📈 Vendor Status Summary:');
    console.log(`   Active vendors: ${activeVendors.length}`);
    console.log(`   Approved vendors: ${approvedVendors.length}`);
    console.log(`   Eligible vendors (active + approved): ${eligibleVendors.length}`);
    console.log('');

    // Analyze live sessions
    const now = new Date();
    const vendorsWithActiveSessions = [];
    const vendorsWithExpiredSessions = [];
    const eligibleVendorsWithoutSessions = [];
    const ineligibleVendorsWithSessions = [];

    vendorsWithSessions.forEach(vendor => {
      const isEligible = vendor.is_active && vendor.is_approved;
      const activeSessions = vendor.vendor_live_sessions.filter(session => {
        if (!session.is_active) return false;
        
        // Check if session has ended
        if (session.end_time && new Date(session.end_time) <= now) return false;
        
        // Check if session has auto-ended
        if (session.auto_end_time && new Date(session.auto_end_time) <= now) return false;
        
        return true;
      });

      const expiredSessions = vendor.vendor_live_sessions.filter(session => {
        return session.is_active && (
          (session.end_time && new Date(session.end_time) <= now) ||
          (session.auto_end_time && new Date(session.auto_end_time) <= now)
        );
      });

      if (activeSessions.length > 0) {
        if (isEligible) {
          vendorsWithActiveSessions.push({ vendor, sessions: activeSessions });
        } else {
          ineligibleVendorsWithSessions.push({ vendor, sessions: activeSessions });
        }
      } else if (isEligible) {
        eligibleVendorsWithoutSessions.push(vendor);
      }

      if (expiredSessions.length > 0) {
        vendorsWithExpiredSessions.push({ vendor, sessions: expiredSessions });
      }
    });

    console.log('🎯 Live Session Analysis:');
    console.log(`   Vendors with active live sessions: ${vendorsWithActiveSessions.length}`);
    console.log(`   Eligible vendors without live sessions: ${eligibleVendorsWithoutSessions.length}`);
    console.log(`   Vendors with expired but still marked active sessions: ${vendorsWithExpiredSessions.length}`);
    console.log(`   Ineligible vendors with active sessions: ${ineligibleVendorsWithSessions.length}`);
    console.log('');

    // Detailed analysis
    if (vendorsWithActiveSessions.length > 0) {
      console.log('✅ VENDORS CURRENTLY LIVE (Should appear on map):');
      vendorsWithActiveSessions.forEach(({ vendor, sessions }) => {
        console.log(`   📍 ${vendor.business_name}`);
        sessions.forEach(session => {
          const location = session.latitude && session.longitude 
            ? `(${session.latitude}, ${session.longitude})` 
            : 'No coordinates';
          const address = session.address || 'No address';
          console.log(`      Session: ${session.id} | ${location} | ${address}`);
        });
      });
      console.log('');
    }

    if (eligibleVendorsWithoutSessions.length > 0) {
      console.log('⚠️  ELIGIBLE VENDORS WITHOUT LIVE SESSIONS:');
      console.log('   (These vendors are active and approved but not currently live)');
      eligibleVendorsWithoutSessions.forEach(vendor => {
        console.log(`   🏪 ${vendor.business_name} (ID: ${vendor.id})`);
      });
      console.log('');
    }

    if (vendorsWithExpiredSessions.length > 0) {
      console.log('🚨 VENDORS WITH EXPIRED SESSIONS (Data inconsistency):');
      console.log('   (These sessions should be marked as inactive)');
      vendorsWithExpiredSessions.forEach(({ vendor, sessions }) => {
        console.log(`   ⏰ ${vendor.business_name}`);
        sessions.forEach(session => {
          const endReason = session.end_time ? `ended at ${session.end_time}` : 
                           session.auto_end_time ? `auto-ended at ${session.auto_end_time}` : 'unknown';
          console.log(`      Session: ${session.id} | ${endReason}`);
        });
      });
      console.log('');
    }

    if (ineligibleVendorsWithSessions.length > 0) {
      console.log('❌ INELIGIBLE VENDORS WITH ACTIVE SESSIONS:');
      console.log('   (These vendors have live sessions but are not active/approved)');
      ineligibleVendorsWithSessions.forEach(({ vendor, sessions }) => {
        const status = `Active: ${vendor.is_active}, Approved: ${vendor.is_approved}`;
        console.log(`   🚫 ${vendor.business_name} | ${status}`);
        sessions.forEach(session => {
          console.log(`      Session: ${session.id}`);
        });
      });
      console.log('');
    }

    // Summary and recommendations
    console.log('📋 SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    if (vendorsWithActiveSessions.length === 0) {
      console.log('🔍 NO LIVE VENDORS FOUND - This explains why the map shows "No vendors found"');
      console.log('');
      
      if (eligibleVendorsWithoutSessions.length > 0) {
        console.log('💡 To fix this, eligible vendors need to start live sessions:');
        console.log('   1. Vendors can start sessions from their dashboard');
        console.log('   2. Or you can create test sessions using the vendor dashboard');
        console.log('   3. Or run a script to create mock live sessions for testing');
      } else {
        console.log('💡 To fix this:');
        console.log('   1. Ensure vendors are marked as active (vendors.is_active = true)');
        console.log('   2. Ensure vendors are approved (vendors.is_approved = true)');
        console.log('   3. Create live sessions for approved vendors');
      }
    } else {
      console.log(`✅ Found ${vendorsWithActiveSessions.length} live vendors`);
      console.log('   These should appear on the map. If they don\'t, check:');
      console.log('   1. Frontend filtering logic');
      console.log('   2. Map bounds/location filtering');
      console.log('   3. Database query in the main page component');
    }

    if (vendorsWithExpiredSessions.length > 0) {
      console.log('');
      console.log('🔧 CLEANUP NEEDED:');
      console.log(`   ${vendorsWithExpiredSessions.length} sessions need to be marked as inactive`);
      console.log('   Run: UPDATE vendor_live_sessions SET is_active = false WHERE ...');
    }

  } catch (error) {
    console.error('❌ Error analyzing vendor status:', error);
  }
}

if (require.main === module) {
  analyzeVendorLiveStatus();
}

module.exports = { analyzeVendorLiveStatus };