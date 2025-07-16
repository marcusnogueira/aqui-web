#!/usr/bin/env node

/**
 * Database Enum Synchronization Script
 * 
 * This script fetches enum values from the database and compares them
 * with the TypeScript constants to ensure they're in sync.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TypeScript constants from lib/constants.ts
const TS_CONSTANTS = {
    VENDOR_STATUSES: {
        PENDING: 'pending',
        APPROVED: 'approved',
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        REJECTED: 'rejected',
        SUSPENDED: 'suspended',
    },
    FEEDBACK_TYPES: {
        BUG: 'BUG',
        FEATURE: 'FEATURE',
        GENERAL: 'GENERAL',
    },
    PRIORITY_LEVELS: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical',
    }
};

async function getEnumValues(enumName) {
    try {
        const { data, error } = await supabase
            .rpc('exec_sql', {
                sql: `SELECT unnest(enum_range(NULL::${enumName})) as enum_value;`
            });

        if (error) {
            console.error(`❌ Error fetching ${enumName}:`, error.message);
            return [];
        }

        return data.map(row => row.enum_value);
    } catch (error) {
        console.error(`❌ Error fetching ${enumName}:`, error.message);
        return [];
    }
}

async function syncEnums() {
    console.log('🔄 Synchronizing database enums with TypeScript constants...\n');

    // Check vendor_status_enum
    console.log('📋 Checking vendor_status_enum...');
    const vendorStatuses = await getEnumValues('vendor_status_enum');
    const tsVendorStatuses = Object.values(TS_CONSTANTS.VENDOR_STATUSES);

    console.log('Database values:', vendorStatuses);
    console.log('TypeScript values:', tsVendorStatuses);

    const vendorMissingInDB = tsVendorStatuses.filter(v => !vendorStatuses.includes(v));
    const vendorMissingInTS = vendorStatuses.filter(v => !tsVendorStatuses.includes(v));

    if (vendorMissingInDB.length > 0) {
        console.log('⚠️  Missing in database:', vendorMissingInDB);
    }
    if (vendorMissingInTS.length > 0) {
        console.log('⚠️  Missing in TypeScript:', vendorMissingInTS);
    }
    if (vendorMissingInDB.length === 0 && vendorMissingInTS.length === 0) {
        console.log('✅ Vendor statuses are in sync');
    }

    console.log('');

    // Check feedback_type_enum
    console.log('📋 Checking feedback_type_enum...');
    const feedbackTypes = await getEnumValues('feedback_type_enum');
    const tsFeedbackTypes = Object.values(TS_CONSTANTS.FEEDBACK_TYPES);

    console.log('Database values:', feedbackTypes);
    console.log('TypeScript values:', tsFeedbackTypes);

    const feedbackMissingInDB = tsFeedbackTypes.filter(v => !feedbackTypes.includes(v));
    const feedbackMissingInTS = feedbackTypes.filter(v => !tsFeedbackTypes.includes(v));

    if (feedbackMissingInDB.length > 0) {
        console.log('⚠️  Missing in database:', feedbackMissingInDB);
    }
    if (feedbackMissingInTS.length > 0) {
        console.log('⚠️  Missing in TypeScript:', feedbackMissingInTS);
    }
    if (feedbackMissingInDB.length === 0 && feedbackMissingInTS.length === 0) {
        console.log('✅ Feedback types are in sync');
    }

    console.log('');

    // Check priority_enum
    console.log('📋 Checking priority_enum...');
    const priorities = await getEnumValues('priority_enum');
    const tsPriorities = Object.values(TS_CONSTANTS.PRIORITY_LEVELS);

    console.log('Database values:', priorities);
    console.log('TypeScript values:', tsPriorities);

    const priorityMissingInDB = tsPriorities.filter(v => !priorities.includes(v));
    const priorityMissingInTS = priorities.filter(v => !tsPriorities.includes(v));

    if (priorityMissingInDB.length > 0) {
        console.log('⚠️  Missing in database:', priorityMissingInDB);
    }
    if (priorityMissingInTS.length > 0) {
        console.log('⚠️  Missing in TypeScript:', priorityMissingInTS);
    }
    if (priorityMissingInDB.length === 0 && priorityMissingInTS.length === 0) {
        console.log('✅ Priority levels are in sync');
    }

    console.log('\n🎯 Enum synchronization check complete!');
}

// Run the sync check
syncEnums().catch(console.error);