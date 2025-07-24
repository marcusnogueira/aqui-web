#!/usr/bin/env node

/**
 * Debug script for Go Live Issue
 * This script will help identify why approved vendors can't go live
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function debugGoLiveIssue() {
  console.log('🔍 Starting Go Live Issue Debug...\n')

  try {
    // 1. Check platform settings
    console.log('1️⃣ Checking platform settings...')
    const { data: platformSettings, error: platformError } = await supabase
      .from('platform_settings_broken')
      .select('*')
      .eq('id', true)
      .single()

    if (platformError) {
      console.error('❌ Platform settings error:', platformError)
    } else {
      console.log('✅ Platform settings:', platformSettings)
    }

    // 2. Check approved vendors
    console.log('\n2️⃣ Checking approved vendors...')
    const { data: approvedVendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, status, user_id, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5)

    if (vendorsError) {
      console.error('❌ Vendors query error:', vendorsError)
    } else {
      console.log('✅ Approved vendors:', approvedVendors)
      
      // Check for potential whitespace issues
      if (approvedVendors && approvedVendors.length > 0) {
        console.log('\n📋 Status analysis:')
        approvedVendors.forEach(vendor => {
          console.log(`  - ${vendor.business_name}: "${vendor.status}" (length: ${vendor.status.length})`)
        })
      }
    }

    // 3. Check all vendor statuses for suspicious values
    console.log('\n3️⃣ Checking all vendor status values...')
    const { data: allStatuses, error: statusError } = await supabase
      .from('vendors')
      .select('status')
      .neq('status', null)

    if (statusError) {
      console.error('❌ Status query error:', statusError)
    } else {
      const statusCounts = {}
      allStatuses.forEach(vendor => {
        const status = vendor.status
        const key = `"${status}" (length: ${status.length})`
        statusCounts[key] = (statusCounts[key] || 0) + 1
      })
      
      console.log('✅ All status values:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} vendors`)
      })
    }

    // 4. Test the go-live logic with current settings
    console.log('\n4️⃣ Testing go-live logic...')
    if (platformSettings) {
      const testCases = ['approved', 'active', 'pending', 'rejected']
      
      testCases.forEach(status => {
        const result = testGoLiveLogic(status, platformSettings)
        console.log(`  - "${status}": ${result.allowed ? '✅ ALLOWED' : '❌ BLOCKED'} - ${result.reason}`)
      })
    }

    // 5. Suggest fixes
    console.log('\n5️⃣ Suggested fixes:')
    
    if (!platformSettings) {
      console.log('❌ Platform settings missing - run the fix-platform-settings.sql script')
    } else {
      if (platformSettings.require_vendor_approval) {
        console.log('⚠️  require_vendor_approval is true - this requires manual approval')
        console.log('   Consider setting it to false to allow all vendors to go live')
      }
      
      if (!platformSettings.allow_auto_vendor_approval) {
        console.log('⚠️  allow_auto_vendor_approval is false - pending vendors cannot go live')
        console.log('   Consider setting it to true to allow pending vendors')
      }
    }

    // Check for whitespace issues
    if (approvedVendors && approvedVendors.some(v => v.status !== v.status.trim())) {
      console.log('❌ Found vendor statuses with whitespace - this needs to be cleaned')
    }

  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

// Test the go-live logic (mirroring the actual function)
function testGoLiveLogic(vendorStatus, platformSettings) {
  const cleanStatus = vendorStatus?.trim()?.toLowerCase()
  
  // If vendor approval is not required, allow any vendor to go live
  if (!platformSettings.require_vendor_approval) {
    return {
      allowed: true,
      reason: 'Vendor approval not required'
    }
  }
  
  // If auto-approval is enabled, allow pending vendors to go live
  if (platformSettings.allow_auto_vendor_approval && cleanStatus === 'pending') {
    return {
      allowed: true,
      reason: 'Auto-approval enabled: pending vendors can go live'
    }
  }
  
  // Standard approval check
  if (cleanStatus === 'approved' || cleanStatus === 'active') {
    return {
      allowed: true,
      reason: 'Vendor is approved and can go live'
    }
  }
  
  // Block inactive vendors
  return {
    allowed: false,
    reason: `Cannot go live. Status: "${vendorStatus}". ${
      platformSettings.require_vendor_approval 
        ? 'Please wait for admin approval.' 
        : 'Please complete your profile.'
    }`
  }
}

// Run the debug
debugGoLiveIssue().then(() => {
  console.log('\n✅ Debug complete!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Debug failed:', error)
  process.exit(1)
})