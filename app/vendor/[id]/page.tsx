'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { VendorWithDetails } from '@/types/vendor';
import { Star, MapPin, Clock, Phone, Mail, Heart, MessageSquare, Flag, X, Navigation } from 'lucide-react';
import { useHeartBeat } from '@/lib/animations';
import { GetDirectionsButton } from '@/components/GetDirectionsButton';
import { getDetailedVendorStatus, extractCoordinatesFromVendor, VendorWithLiveSession } from '@/lib/vendor-utils';
import { useSession } from 'next-auth/react';

type VendorLocation = Database['public']['Tables']['vendor_static_locations']['Row'];
type VendorAnnouncement = Database['public']['Tables']['vendor_announcements']['Row'];
type VendorSpecial = Database['public']['Tables']['vendor_specials']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];
type User = Database['public']['Tables']['users']['Row'];

// Extended interface for this specific page with additional computed fields
interface VendorProfileData extends Omit<VendorWithDetails, 'status'> {
  location?: VendorLocation;
  announcements: VendorAnnouncement[];
  specials: VendorSpecial[];
  reviews: (Review & { user: Pick<User, 'full_name' | 'avatar_url'> })[];
  averageRating: number;
  totalReviews: number;
  isLive: boolean;
  status: 'live' | 'closing_soon' | 'offline';
}

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { data: session } = useSession();
  
  const [vendor, setVendor] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteClicked, setFavoriteClicked] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', description: '' });
  const [submittingReport, setSubmittingReport] = useState(false);
  const heartBeatRef = useHeartBeat(favoriteClicked);

  const vendorId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!vendorId) {
      setError("Vendor ID is missing.");
      setLoading(false);
      return;
    }
    fetchVendorData();
    fetchUser();
  }, [vendorId, session]);

  const fetchUser = async () => {
    try {
      if (session?.user) {
        const authUser = session.user;
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser(userData);
        
        // Check if vendor is favorited
        if (userData) {
          const { data: favorite } = await supabase
            .from('favorites')
            .select('id')
            .eq('customer_id', userData.id)
            .eq('vendor_id', vendorId)
            .single();
          setIsFavorite(!!favorite);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor basic info
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;
      if (!vendorData) throw new Error('Vendor not found');

      // Fetch vendor location
      const { data: locationData } = await supabase
        .from('vendor_static_locations')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_primary', true)
        .single();

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('vendor_announcements')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Fetch specials
      const { data: specialsData } = await supabase
        .from('vendor_specials')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Fetch reviews with user info
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      // Fetch live session to determine status
      const { data: liveSession } = await supabase
        .from('vendor_live_sessions')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .is('end_time', null)
        .single();

      // Determine vendor status using shared utility
      const statusInfo = getDetailedVendorStatus({
        ...vendorData,
        live_session: liveSession
      });
      const status = statusInfo;
      const isLive = statusInfo === 'live' || statusInfo === 'closing_soon';

      const vendorWithDetails: VendorProfileData = {
        ...vendorData,
        location: locationData || undefined,
        announcements: announcementsData || [],
        specials: specialsData || [],
        reviews: (reviewsData || []) as any,
        averageRating: vendorData.average_rating || 0,
        totalReviews: vendorData.total_reviews || 0,
        isLive,
        status
      };

      setVendor(vendorWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    
    try {
      setFavoriteClicked(true);
      setTimeout(() => setFavoriteClicked(false), 600);
      
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('customer_id', user.id)
          .eq('vendor_id', vendorId);
        setIsFavorite(false);
      } else {
        await supabase
          .from('favorites')
          .insert({ customer_id: user.id, vendor_id: vendorId });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Extract coordinates for directions
  const coordinates = vendor ? extractCoordinatesFromVendor(vendor as unknown as VendorWithLiveSession) : null;

  const submitReview = async () => {
    if (!user || !newReview.comment.trim()) return;
    
    try {
      setSubmittingReview(true);
      
      // Insert the review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          vendor_id: vendorId,
          rating: newReview.rating,
          review: newReview.comment.trim()
        });

      if (reviewError) throw reviewError;
      
      // Update vendor's average rating and total reviews
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', vendorId);
      
      if (allReviews) {
        const totalReviews = allReviews.length;
        const averageRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews;
        
        await supabase
          .from('vendors')
          .update({
            average_rating: averageRating,
            total_reviews: totalReviews
          })
          .eq('id', vendorId);
      }
      
      setNewReview({ rating: 5, comment: '' });
      fetchVendorData(); // Refresh to show new review
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitReport = async () => {
    if (!user || !reportData.reason.trim()) return;
    
    try {
      setSubmittingReport(true);
      
      const { error } = await supabase
        .from('vendor_reports')
        .insert({
          vendor_id: vendorId,
          reporter_id: user.id,
          reason: reportData.reason.trim()
        });

      if (error) throw error;
      
      setReportData({ reason: '', description: '' });
      setShowReportModal(false);
      alert('Report submitted successfully. Thank you for your feedback.');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600 bg-green-100';
      case 'closing_soon': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Live Now';
      case 'closing_soon': return 'Closing Soon';
      default: return 'Offline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The vendor you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            aria-label="Back to Home"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 mb-4"
            aria-label="Back to Map"
          >
            ← Back to Map
          </button>
        </div>
      </div>

      {/* Vendor Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover Image */}
          <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            {vendor.banner_image_url && vendor.banner_image_url.length > 0 && (
              <img
                src={vendor.banner_image_url[0]}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 py-8">
            {/* Profile Image */}
            <div className="absolute -top-16 left-6">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
                {vendor.profile_image_url ? (
                  <img
                    src={vendor.profile_image_url}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-2xl font-bold">
                      {vendor.business_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mb-4">
              {user && (
                <>
                  <button
                    onClick={toggleFavorite}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                      isFavorite 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart ref={heartBeatRef} className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''} ${favoriteClicked ? 'animate-heartbeat' : ''}`} />
                    <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report Vendor</span>
                  </button>
                </>
              )}
            </div>

            {/* Basic Info */}
            <div className="mt-16">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{vendor.business_name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vendor.status)}`}>
                  {getStatusText(vendor.status)}
                </span>
              </div>

              {/* Tags */}
              {vendor.tags && vendor.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {vendor.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (vendor.averageRating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {vendor.average_rating?.toFixed(1) || '0.0'} ({vendor.total_reviews || 0} reviews)
                </span>
              </div>

              {/* Location */}
              {vendor.location && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">{vendor.location.address}</span>
                  </div>
                  {coordinates && (
                    <GetDirectionsButton
                      destination={coordinates}
                      vendorName={vendor.business_name}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    />
                  )}
                </div>
              )}

              {/* Contact */}
              {vendor.contact_email && (
                <div className="flex items-center space-x-2 mb-6">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">{vendor.contact_email}</span>
                </div>
              )}

              {/* Description */}
              <p className="text-gray-700 mb-8">{vendor.description}</p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Announcements */}
            {vendor.announcements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Announcements</h2>
                <div className="space-y-4">
                  {vendor.announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-gray-600">{announcement.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specials */}
            {vendor.specials.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current Specials</h2>
                <div className="grid gap-4">
                  {vendor.specials.map((special) => (
                    <div key={special.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{special.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-2">{special.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
              
              {/* Add Review Form */}
              {user && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="focus:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newReview.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || !newReview.comment.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {vendor.reviews.length > 0 ? (
                  vendor.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {review.user.avatar_url ? (
                            <img
                              src={review.user.avatar_url}
                              alt={review.user.full_name || 'User'}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {(review.user.full_name || 'U').charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {review.user.full_name || 'Anonymous'}
                            </span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= (review.rating || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.created_at &&
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            }
                          </div>
                          <p className="text-gray-700">{review.review}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No reviews yet. Be the first to review this vendor!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-700 font-medium">Cuisine Type</span>
                  <p className="font-semibold text-gray-900">{vendor.subcategory || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-700 font-medium">Business Type</span>
                  <p className="font-semibold text-gray-900">{vendor.business_type || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-700 font-medium">Status</span>
                  <p className={`font-semibold ${getStatusColor(vendor.status).replace('bg-', 'text-')}`}>
                    {getStatusText(vendor.status)}
                  </p>
                </div>
              </div>
            </div>

            {/* Map Preview */}
            {vendor.location && vendor.location.latitude && vendor.location.longitude && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Location</h3>
                <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                  <span className="ml-2 text-gray-500">Map Preview</span>
                </div>
                <p className="text-sm text-gray-600">{vendor.location.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {vendor.location.latitude.toFixed(6)}, {vendor.location.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Vendor Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Vendor</h3>
              <button
                 onClick={() => setShowReportModal(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close report modal"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Report *
                </label>
                <select
                   value={reportData.reason}
                   onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   aria-label="Reason for report"
                   required
                 >
                  <option value="">Select a reason</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="false_information">False Information</option>
                  <option value="poor_service">Poor Service</option>
                  <option value="safety_concerns">Safety Concerns</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Please provide additional details about your report..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={submittingReport || !reportData.reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}