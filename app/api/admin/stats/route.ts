import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAdminTokenServer } from '@/lib/admin-auth-server';
import { USER_ROLES, MODERATION_STATUSES, ERROR_MESSAGES, HTTP_STATUS, getTimeAgoISO } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const supabase = createSupabaseServerClient(cookies());

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error fetching users count:', usersError);
    }

    // Get active vendors count
    const { count: activeVendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    if (vendorsError) {
      console.error('Error fetching vendors count:', vendorsError);
    }

    // Get pending vendor reports
    const { count: pendingVendorReports, error: vendorReportsError } = await supabase
      .from('vendor_reports')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);

    if (vendorReportsError) {
      console.error('Error fetching vendor reports count:', vendorReportsError);
    }

    // Get pending customer reports
    const { count: pendingCustomerReports, error: customerReportsError } = await supabase
      .from('customer_reports')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);

    if (customerReportsError) {
      console.error('Error fetching customer reports count:', customerReportsError);
    }

    const pendingReviews = (pendingVendorReports || 0) + (pendingCustomerReports || 0);

    // Get pending vendor applications
    const { count: pendingApplications, error: applicationsError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (applicationsError) {
      console.error('Error fetching pending applications:', applicationsError);
    }

    // Get pending feedback
    const { count: pendingFeedback, error: feedbackError } = await supabase
      .from('vendor_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (feedbackError) {
      console.error('Error fetching pending feedback:', feedbackError);
    }

    // Get recent user registrations (last 7 days)
    const sevenDaysAgo = getTimeAgoISO(7);
    
    const { count: recentUsers, error: recentUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    if (recentUsersError) {
      console.error('Error fetching recent users:', recentUsersError);
    }

    // Get pending analytics exports
    const { count: pendingExports, error: exportsError } = await supabase
      .from('analytics_exports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (exportsError) {
      console.error('Error fetching pending exports:', exportsError);
    }

    // Get recent exports (last 24 hours)
    const twentyFourHoursAgo = getTimeAgoISO(1);
    
    const { count: recentExports, error: recentExportsError } = await supabase
      .from('analytics_exports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo);

    if (recentExportsError) {
      console.error('Error fetching recent exports:', recentExportsError);
    }

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeVendors: activeVendors || 0,
        pendingReviews: pendingReviews,
        revenue: 0 // Placeholder - would need transaction/order data
      },
      quickActions: {
        pendingApplications: pendingApplications || 0,
        moderationQueue: pendingReviews,
        pendingExports: pendingExports || 0,
        recentUsers: recentUsers || 0,
        pendingFeedback: pendingFeedback || 0,
        recentExports: recentExports || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}